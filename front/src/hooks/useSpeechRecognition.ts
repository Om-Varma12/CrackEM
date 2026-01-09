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
export const useSpeechRecognition = (isEnabled: boolean): UseSpeechRecognitionReturn => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isRecognizingRef = useRef(false);
  const sentenceBufferRef = useRef<string>('');
  const interimBufferRef = useRef<string>('');
  const silenceTimeoutRef = useRef<number | null>(null);
  const lastInterimSentRef = useRef<number>(0);
  const SILENCE_DURATION = 600; // 600ms of silence before sending final sentence
  const INTERIM_THROTTLE_MS = 400; // send interim updates at most once every 400ms

  const sendSentence = useCallback((sentence: string, type: 'transcript' | 'interim' = 'transcript', clearBuffer = false) => {
    if (!sentence.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type,
        text: sentence.trim()
      }));
      if (clearBuffer && type === 'transcript') {
        sentenceBufferRef.current = '';
      }
    } catch (error) {
      console.error('Error sending transcript:', error);
    }
  }, []);

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
      silenceTimeoutRef.current = window.setTimeout(() => {
        if (sentenceBufferRef.current) {
          sendSentence(sentenceBufferRef.current, 'transcript', true);
        } else if (interimBufferRef.current) {
          // Promote interim to final if nothing buffered
          sendSentence(interimBufferRef.current, 'transcript', true);
        }
      }, SILENCE_DURATION);
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
      // Create WebSocket connection
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/transcript';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      wsRef.current = ws;

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
      };
      recognition.onend = () => {
        handleEnd();
        // Auto-restart recognition if still enabled
        if (isRecognizingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            recognition.start();
          } catch (e) {
            // Recognition might already be starting, ignore error
          }
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

