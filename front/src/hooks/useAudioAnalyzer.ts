import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAudioAnalyzerReturn {
  volumeLevel: number;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  error: string | null;
}

export const useAudioAnalyzer = (isEnabled: boolean): UseAudioAnalyzerReturn => {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyzerRef.current = null;
    setIsListening(false);
    setVolumeLevel(0);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      setIsListening(true);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const updateVolume = () => {
        if (!analyzerRef.current) return;
        
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;
        
        // Normalize to 0-100 range with some boost for visibility
        const normalizedVolume = Math.min(100, (average / 128) * 100 * 1.5);
        setVolumeLevel(normalizedVolume);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Audio access error:', err);
      setError('Microphone access denied');
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (isEnabled && !isListening) {
      startListening();
    } else if (!isEnabled && isListening) {
      stopListening();
    }
    
    return () => {
      stopListening();
    };
  }, [isEnabled, isListening, startListening, stopListening]);

  return {
    volumeLevel,
    isListening,
    startListening,
    stopListening,
    error,
  };
};
