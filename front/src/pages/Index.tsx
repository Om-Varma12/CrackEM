import { useState, useCallback, useEffect } from 'react';
import AIAvatar from '@/components/interview/AIAvatar';
import UserCamera from '@/components/interview/UserCamera';
import InterviewControls from '@/components/interview/InterviewControls';
import QuestionDisplay from '@/components/interview/QuestionDisplay';
import InterviewTimer from '@/components/interview/InterviewTimer';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Sparkles } from 'lucide-react';

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background. What drives your passion for this field?",
  "Describe a challenging project you've worked on. What obstacles did you face and how did you overcome them?",
  "How do you approach learning new technologies or skills? Can you give me a specific example?",
  "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
  "What do you consider your greatest professional achievement, and why does it matter to you?",
  "How do you prioritize tasks when you have multiple deadlines approaching simultaneously?",
  "Describe your ideal work environment. What factors help you perform at your best?",
  "Where do you see yourself in five years, and how does this role fit into your career goals?",
  "What questions do you have for us about the company or the position?",
  "Is there anything else you'd like to share that we haven't covered in this interview?",
];

type InterviewStatus = 'idle' | 'speaking' | 'listening' | 'processing';

const Index = () => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [mounted, setMounted] = useState(false);

  // Real-time audio analysis
  const { volumeLevel } = useAudioAnalyzer(isInterviewActive && isMicOn);
  
  // Speech recognition and send transcriptions to backend
  useSpeechRecognition(isInterviewActive && isMicOn);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate AI speaking when question changes
  useEffect(() => {
    if (!isInterviewActive) return;

    setStatus('speaking');
    const speakingDuration = 2000 + Math.random() * 1000;

    const timeout = setTimeout(() => {
      setStatus('listening');
    }, speakingDuration);

    return () => clearTimeout(timeout);
  }, [currentQuestionIndex, isInterviewActive]);

  const handleStartInterview = useCallback(() => {
    setIsInterviewActive(true);
    setCurrentQuestionIndex(0);
    setStatus('speaking');
  }, []);

  const handleEndInterview = useCallback(() => {
    setIsInterviewActive(false);
    setCurrentQuestionIndex(0);
    setStatus('idle');
  }, []);

  const handleToggleMic = useCallback(() => {
    setIsMicOn(prev => !prev);
  }, []);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOn(prev => !prev);
  }, []);

  return (
    <div 
      className={`min-h-screen flex flex-col bg-background transition-opacity duration-700 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">InterviewAI</h1>
            <p className="text-xs text-muted-foreground">Professional Interview Platform</p>
          </div>
        </div>

        <InterviewTimer isActive={isInterviewActive} />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - AI Interviewer */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border bg-gradient-to-br from-primary/[0.02] to-accent/[0.02]">
          <div className="w-full max-w-md space-y-10">
            <AIAvatar 
              isSpeaking={status === 'speaking'} 
              status={status}
            />
            
            <QuestionDisplay
              question={INTERVIEW_QUESTIONS[currentQuestionIndex]}
              isActive={isInterviewActive}
            />
          </div>
        </div>

        {/* Right side - User Camera */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 bg-secondary/50">
          <UserCamera
            isActive={isInterviewActive}
            isCameraOn={isCameraOn}
            isRecording={isInterviewActive}
            userName="Candidate"
          />
        </div>
      </main>

      {/* Bottom controls */}
      <footer className="p-4 md:p-6 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto">
          <InterviewControls
            isInterviewActive={isInterviewActive}
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            onToggleMic={handleToggleMic}
            onToggleCamera={handleToggleCamera}
            volumeLevel={volumeLevel}
          />
        </div>
      </footer>
    </div>
  );
};

export default Index;
