import { useEffect, useState } from 'react';
import { User, Smile } from 'lucide-react';

interface AIAvatarProps {
  isSpeaking: boolean;
  status: string;
}

const AIAvatar = ({ isSpeaking, status }: AIAvatarProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className={`flex flex-col items-center gap-8 transition-opacity duration-500 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Avatar Container */}
      <div className="avatar-container">
        {/* Outer glow ring */}
        <div 
          className="absolute inset-[-4px] rounded-full opacity-30"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            filter: 'blur(12px)',
          }}
        />
        
        {/* Animated gradient border */}
        <div className="avatar-circle" />
        
        {/* Inner white circle with face */}
        <div className="avatar-inner">
          <div className="avatar-face">
            {/* Friendly face icon */}
            <div className="relative">
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))',
                }}
              >
                <Smile 
                  className="w-12 h-12 md:w-14 md:h-14 text-primary" 
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sound waves - show when speaking */}
        <div className={`sound-waves ${!isSpeaking ? 'sound-waves-idle' : ''}`}>
          <div className="sound-wave-bar" />
          <div className="sound-wave-bar" />
          <div className="sound-wave-bar" />
          <div className="sound-wave-bar" />
          <div className="sound-wave-bar" />
        </div>
      </div>

      {/* AI Identity */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Nova</h2>
        <p className="text-sm text-muted-foreground">Your Interview Guide</p>
        
        {/* Status indicator */}
        <div className="status-indicator mx-auto mt-4">
          <span 
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isSpeaking 
                ? 'bg-primary animate-pulse' 
                : status === 'listening' 
                  ? 'bg-success animate-pulse' 
                  : 'bg-muted-foreground/50'
            }`} 
          />
          <span className="text-muted-foreground capitalize">
            {status === 'idle' ? 'Ready' : status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIAvatar;