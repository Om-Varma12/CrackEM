import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface InterviewTimerProps {
  isActive: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

const InterviewTimer = ({ isActive, onTimeUpdate }: InterviewTimerProps) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1;
          onTimeUpdate?.(newValue);
          return newValue;
        });
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="status-indicator">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span className="font-mono text-sm tabular-nums">
        {formatTime(seconds)}
      </span>
    </div>
  );
};

export default InterviewTimer;
