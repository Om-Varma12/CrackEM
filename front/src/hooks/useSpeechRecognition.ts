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
export const useSpeechRecognition = (isEnabled: boolean, meetID?: string, onAiResponse?: (text: string, isDone: boolean) => void): UseSpeechRecognitionReturn => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isRecognizingRef = useRef(false);
  const sentenceBufferRef = useRef<string>('');
  const interimBufferRef = useRef<string>('');
  const silenceTimeoutRef = useRef<number | null>(null);

  const lastInterimSentRef = useRef<number>(0);
  const aiResponseBufferRef = useRef<string>('');
  const SILENCE_DURATION = 1000; // 600ms of silence before sending final sentence
  const INTERIM_THROTTLE_MS = 400; // send interim updates at most once every 400ms

  const sendSentence = useCallback((sentence: string, type: 'transcript' | 'interim' = 'transcript', clearBuffer = false) => {
    if (!sentence.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const payload: any = {
        type,
        text: sentence.trim()
      };

      wsRef.current.send(JSON.stringify(payload));
      if (clearBuffer && type === 'transcript') {
        sentenceBufferRef.current = '';
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
    } else {
      // Interim result: send throttled interim updates
      interimBufferRef.current = transcript;
      const now = Date.now();
      if (now - lastInterimSentRef.current >= INTERIM_THROTTLE_MS) {
        sendSentence(interimBufferRef.current, 'interim', false);
        lastInterimSentRef.current = now;
      }

      // Also set a silence timeout to promote interim to final when user pauses
      // silenceTimeoutRef.current = window.setTimeout(() => {
      //   if (sentenceBufferRef.current) {
      //     sendSentence(sentenceBufferRef.current, 'transcript', true);
      //   } else if (interimBufferRef.current) {
      //     // Promote interim to final if nothing buffered
      //     sendSentence(interimBufferRef.current, 'transcript', true);
      //   }
      // }, SILENCE_DURATION);
    }
  }, [sendSentence]);

  const handleEnd = useCallback(() => {
    // Send any remaining sentence when recognition ends
    if (sentenceBufferRef.current.trim()) {
      sendSentence(sentenceBufferRef.current, 'transcript', true);
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
      const wsUrlBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/transcript';
      const wsUrl = meetID ? `${wsUrlBase}?meetID=${encodeURIComponent(meetID)}` : wsUrlBase;
      const ws = new WebSocket(wsUrl);

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      wsRef.current = ws;

      // Listen for AI responses from the server and handle TTS / UI callback
      ws.onmessage = (evt: MessageEvent) => {
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

      // Initialize Speech Recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = handleResult;
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // No speech detected, send pending sentence if exists
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
        handleEnd();
        // Auto-restart recognition if still enabled (small delay for reliability)
        if (isRecognizingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
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

