import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Play
} from 'lucide-react';

interface InterviewControlsProps {
  isInterviewActive: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  onStartInterview: () => void;
  onEndInterview: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  volumeLevel: number;
}

const InterviewControls = ({
  isInterviewActive,
  isMicOn,
  isCameraOn,
  onStartInterview,
  onEndInterview,
  onToggleMic,
  onToggleCamera,
  volumeLevel,
}: InterviewControlsProps) => {
  // Calculate which bars should be active based on volume
  const getBarActive = (barIndex: number) => {
    const thresholds = [5, 25, 50, 75, 90];
    return volumeLevel > thresholds[barIndex];
  };

  return (
    <div className="glass-panel-strong p-4 md:p-6 animate-slide-up">
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {/* Microphone toggle with real-time volume indicator */}
        <div className="relative">
          <button
            onClick={onToggleMic}
            disabled={!isInterviewActive}
            className={`control-button ${
              !isInterviewActive 
                ? 'opacity-50 cursor-not-allowed' 
                : isMicOn 
                  ? 'control-button-active' 
                  : 'control-button-danger'
            }`}
            aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? (
              <Mic className="w-5 h-5 text-primary" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
          
          {/* Real-time volume bars */}
          {isMicOn && isInterviewActive && (
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    getBarActive(i) ? 'bg-success' : 'bg-muted'
                  }`}
                  style={{ 
                    height: `${8 + i * 4}px`,
                    opacity: getBarActive(i) ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spacer for volume bars */}
        {isMicOn && isInterviewActive && <div className="w-4" />}

        {/* Camera toggle */}
        <button
          onClick={onToggleCamera}
          className={`control-button ${
            isCameraOn ? 'control-button-active' : 'control-button-danger'
          }`}
          aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? (
            <Video className="w-5 h-5 text-primary" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-border mx-2" />

        {/* Start/End Interview button */}
        {!isInterviewActive ? (
          <button
            onClick={onStartInterview}
            className="interview-button-primary flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            <span className="hidden sm:inline">Start Interview</span>
            <span className="sm:hidden">Start</span>
          </button>
        ) : (
          <button
            onClick={onEndInterview}
            className="interview-button-danger flex items-center gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Interview</span>
            <span className="sm:hidden">End</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewControls;
