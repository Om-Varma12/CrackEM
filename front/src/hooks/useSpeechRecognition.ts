import { useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
  startRecognition: () => Promise<void>;
  stopRecognition: () => void;
  isRecognizing: boolean;
  error: string | null;
}

/**
 * Hook for speech recognition using Web Speech API
 * Sends transcribed text to backend via WebSocket
 */
export const useSpeechRecognition = (isEnabled: boolean, meetID?: string, onAiResponse?: (text: string, isDone: boolean) => void, lastLLMResponse?: string | null): UseSpeechRecognitionReturn => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isRecognizingRef = useRef(false);
  const sentenceBufferRef = useRef<string>('');
  const interimBufferRef = useRef<string>('');
  const silenceTimeoutRef = useRef<number | null>(null);
  const lastLLMResponseRef = useRef<string | null>(null);

  useEffect(() => {
    lastLLMResponseRef.current = lastLLMResponse || null;
  }, [lastLLMResponse]);

  const lastInterimSentRef = useRef<number>(0);
  const aiResponseBufferRef = useRef<string>('');
  const lastResultTimestampRef = useRef<number>(0);
  const SILENCE_DURATION = 1000; // ms of silence before sending final sentence (shorter for responsiveness)
  const INTERIM_THROTTLE_MS = 300; // send interim updates at most once every 300ms

  // Queue outgoing messages while the socket is not open
  const sendQueueRef = useRef<Array<{type: string; text: string; clearBuffer?: boolean}>>([]);
  const wsBackoffRef = useRef<number>(0);
  const wsReconnectTimeoutRef = useRef<number | null>(null);

  const sendSentence = useCallback((sentence: string, type: 'transcript' | 'interim' = 'transcript', clearBuffer = false) => {
    if (!sentence.trim()) return;

    // If socket not ready, queue the message (preserve clearBuffer and log queue size)
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      sendQueueRef.current.push({ type, text: sentence.trim(), clearBuffer });
      console.debug('Queued transcript (socket not open):', sentence.trim(), 'queueSize=', sendQueueRef.current.length, 'wsState=', wsRef.current?.readyState);
      if (clearBuffer && type === 'transcript') {
        sentenceBufferRef.current = '';
        interimBufferRef.current = '';
      }
      return;
    }

    try {
      const payload: any = {
        type,
        text: sentence.trim(),
        lastLLMResponse: lastLLMResponseRef.current
      };

      console.debug('Sending transcript:', payload, 'wsState=', wsRef.current?.readyState, 'queueSize=', sendQueueRef.current.length);
      wsRef.current.send(JSON.stringify(payload));
      if (clearBuffer && type === 'transcript') {
        sentenceBufferRef.current = '';
        interimBufferRef.current = '';
      }
    } catch (error) {
      console.error('Error sending transcript:', error);
    }
  }, [meetID]);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    const lastResult = event.results[event.results.length - 1];
    const transcript = lastResult[0].transcript;
    const isFinal = lastResult.isFinal;

    if (!transcript.trim()) return;

    // Update timestamp for most recent result
    lastResultTimestampRef.current = Date.now();

    // Clear previous silence timeout
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (isFinal) {
      // Append to buffer and send final transcript immediately
      if (sentenceBufferRef.current) {
        sentenceBufferRef.current += ' ' + transcript;
      } else {
        sentenceBufferRef.current = transcript;
      }
      sendSentence(sentenceBufferRef.current, 'transcript', true);
      // Clear interim buffer after final
      interimBufferRef.current = '';
      lastInterimSentRef.current = 0;
    } else {
      // Interim result: send throttled interim updates
      interimBufferRef.current = transcript;
      const now = Date.now();
      if (now - lastInterimSentRef.current >= INTERIM_THROTTLE_MS) {
        sendSentence(interimBufferRef.current, 'interim', false);
        lastInterimSentRef.current = now;
      }

      // Set a silence timeout to promote interim to final when user pauses
      silenceTimeoutRef.current = window.setTimeout(() => {
        silenceTimeoutRef.current = null;
        if (sentenceBufferRef.current) {
          // If we already have a buffered sentence, send it as final
          sendSentence(sentenceBufferRef.current, 'transcript', true);
        }// else if (interimBufferRef.current) {
        //   // Promote interim to final if nothing buffered
        //   console.debug('Promoting interim to final:', interimBufferRef.current);
        //   sendSentence(interimBufferRef.current, 'transcript', true);
        //   interimBufferRef.current = '';
        //}
      }, SILENCE_DURATION);
    }
  }, [sendSentence]);

  const handleEnd = useCallback(() => {
    // Send any remaining sentence when recognition ends only if it wasn't a very recent result
    const now = Date.now();
    if (now - lastResultTimestampRef.current > SILENCE_DURATION) {
      if (sentenceBufferRef.current.trim()) {
        sendSentence(sentenceBufferRef.current, 'transcript', true);
      }
    } else {
      console.debug('handleEnd: deferring send because last result was recent');
    }
  }, [sendSentence]);

  const startRecognition = useCallback(async () => {
    if (isRecognizingRef.current) return;

    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported in this browser');
      return;
    }

    try {
      // Create WebSocket connection (include meetID if available)
      // Use a helper to handle reconnect and queueing of outgoing messages.
      const wsUrlBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/transcript';
      const wsUrl = meetID ? `${wsUrlBase}?meetID=${encodeURIComponent(meetID)}` : wsUrlBase;

      const flushQueue = (socket: WebSocket) => {
        while (sendQueueRef.current.length > 0 && socket.readyState === WebSocket.OPEN) {
          const item = sendQueueRef.current.shift();
          if (!item) break;
          try {
            socket.send(JSON.stringify({ type: item.type, text: item.text, lastLLMResponse: lastLLMResponseRef.current }));
            if (item.clearBuffer && item.type === 'transcript') {
              sentenceBufferRef.current = '';
              interimBufferRef.current = '';
            }
          } catch (e) {
            console.error('Error flushing queued message:', e);
            break;
          }
        }
        console.debug('Flush complete, remaining queue size=', sendQueueRef.current.length);
      };

      const scheduleReconnect = () => {
        if (!isRecognizingRef.current) return;
        wsBackoffRef.current = Math.min(6, wsBackoffRef.current + 1); // cap attempts
        const delay = Math.min(30000, 500 * Math.pow(1.8, wsBackoffRef.current));
        if (wsReconnectTimeoutRef.current) {
          window.clearTimeout(wsReconnectTimeoutRef.current);
        }
        wsReconnectTimeoutRef.current = window.setTimeout(() => {
          if (!isRecognizingRef.current) return;
          connectWebSocket();
        }, delay);
      };

      const connectWebSocket = () => {
        try {
          // Avoid creating duplicate connections
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
          const socket = new WebSocket(wsUrl);

          socket.onopen = () => {
            console.log('WebSocket connection opened, queueSize=', sendQueueRef.current.length);
            wsBackoffRef.current = 0;
            flushQueue(socket);
          };

          socket.onerror = (error) => {
            console.error('WebSocket error:', error);
          };

          socket.onclose = (evt: CloseEvent) => {
            console.log('WebSocket connection closed', evt.code, evt.reason);
            // Replace reference and schedule reconnect if recognition is active
            if (wsRef.current === socket) {
              wsRef.current = null;
            }
            if (isRecognizingRef.current) {
              scheduleReconnect();
            }
          };

          // Replace wsRef and attach message handler
          wsRef.current = socket;

          socket.onmessage = (evt: MessageEvent) => {
            try {
              const data = JSON.parse(evt.data);
              
              if (data.type === 'ai_response_chunk' && data.text) {
                 aiResponseBufferRef.current += data.text;
                 if (onAiResponse) {
                   onAiResponse(aiResponseBufferRef.current, false);
                 }
              } else if (data.type === 'ai_response_done') {
                 if (onAiResponse) {
                   onAiResponse(aiResponseBufferRef.current, true);
                 }
                 // Reset buffer after done
                 aiResponseBufferRef.current = '';
              } else if (data.type === 'ai_response' && data.text) {
                // Fallback / legacy support
                console.log('AI response received:', data.text);
                const rawText = data.text;

                if (onAiResponse) {
                  onAiResponse(rawText, true);
                } else {
                  // Try to extract `question` field if the AI response is JSON
                  let speakText = rawText;
                  const looksLikeJson = typeof rawText === 'string' && (rawText.trim().startsWith('{') || rawText.trim().startsWith('['));
                  if (looksLikeJson) {
                    try {
                      const parsed = JSON.parse(rawText);
                      if (parsed && typeof parsed === 'object' && 'question' in parsed) {
                        const q = (parsed as any).question;
                        speakText = typeof q === 'string' ? q : JSON.stringify(q);
                      }
                    } catch (e) {
                      // ignore parse errors
                    }
                  }

                  const utterance = new SpeechSynthesisUtterance(speakText);
                  window.speechSynthesis.speak(utterance);
                }
              }
            } catch (e) {
              console.error('Error parsing WebSocket message:', e);
            }
          };

        } catch (error) {
          console.error('Error connecting WebSocket:', error);
          scheduleReconnect();
        }
      };

      // Start initial WebSocket
      connectWebSocket();

      // Initialize Speech Recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // update timestamp for last received result
        lastResultTimestampRef.current = Date.now();
        handleResult(event);
      };

      recognition.onstart = () => {
        console.debug('Speech recognition started');
      };

      recognition.onnomatch = (event: SpeechRecognitionEvent) => {
        console.debug('Speech recognition no match:', event);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event);
        if (event.error === 'no-speech') {
          // No speech detected, send pending sentence if enough time has passed
          if (sentenceBufferRef.current.trim()) {
            sendSentence(sentenceBufferRef.current, 'transcript', true);
          }
        }

        // For transient errors, try to restart recognition so we keep listening
        const transientErrors = ['no-speech', 'audio-capture', 'network', 'aborted'];
        if (isRecognizingRef.current && transientErrors.includes(event.error)) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // ignore start errors
            }
          }, 200);
        }
      };

      recognition.onend = () => {
        // If recognition ended but the last result was very recent, defer sending to allow restart
        const now = Date.now();
        if (now - lastResultTimestampRef.current > SILENCE_DURATION) {
          handleEnd();
        } else {
          console.debug('Recognition ended shortly after a result; deferring final send to allow restart');
        }

        // Auto-restart recognition if still enabled (small delay for reliability)
        if (isRecognizingRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // ignore
            }
          }, 150);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isRecognizingRef.current = true;

    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, [handleResult, handleEnd, sendSentence]);

  const stopRecognition = useCallback(() => {
    isRecognizingRef.current = false;

    // Clear silence timeout
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      // Send any remaining sentence before closing
      if (sentenceBufferRef.current.trim()) {
        sendSentence(sentenceBufferRef.current, 'transcript', true);
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnect attempts
    if (wsReconnectTimeoutRef.current) {
      window.clearTimeout(wsReconnectTimeoutRef.current);
      wsReconnectTimeoutRef.current = null;
    }
    wsBackoffRef.current = 0;
    sendQueueRef.current = [];

    sentenceBufferRef.current = '';
  }, [sendSentence]);

  useEffect(() => {
    if (isEnabled) {
      startRecognition().catch(console.error);
    } else {
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
  }, [isEnabled, startRecognition, stopRecognition]);

  return {
    startRecognition,
    stopRecognition,
    isRecognizing: isRecognizingRef.current,
    error: null,
  };
};

