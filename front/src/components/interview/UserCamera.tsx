import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface UserCameraProps {
  isActive: boolean;
  isCameraOn: boolean;
  isRecording: boolean;
  userName?: string;
}

const UserCamera = ({ isActive, isCameraOn, isRecording, userName = "You" }: UserCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initCamera = async () => {
      if (isCameraOn && !stream) {
        setIsLoading(true);
        setError(null);
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
            audio: false,
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error('Camera access error:', err);
          setError('Camera access denied. Please enable camera permissions.');
        } finally {
          setIsLoading(false);
        }
      } else if (!isCameraOn && stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="video-frame w-full max-w-2xl aspect-video bg-muted">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Camera off state */}
        {!isCameraOn && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/80">
            <div className="p-4 rounded-full bg-muted/50">
              <CameraOff className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Camera is off</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/80">
            <div className="p-4 rounded-full bg-muted/50 animate-pulse">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <p className="text-muted-foreground">Initializing camera...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/80 p-6">
            <div className="p-4 rounded-full bg-destructive/20">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <p className="text-muted-foreground text-center text-sm max-w-xs">{error}</p>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && isCameraOn && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
            <span className="recording-dot" />
            <span className="text-sm font-medium text-destructive">REC</span>
          </div>
        )}

        {/* User name badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm">
          <span className="text-sm font-medium text-foreground">{userName}</span>
        </div>

        {/* Connection quality indicator */}
        {isCameraOn && !error && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 rounded-full bg-success" />
              <div className="w-1 h-4 rounded-full bg-success" />
              <div className="w-1 h-5 rounded-full bg-success" />
            </div>
            <span className="text-xs text-muted-foreground">HD</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCamera;
