import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIAvatar from '@/components/interview/AIAvatar';
import UserCamera from '@/components/interview/UserCamera';
import InterviewControls from '@/components/interview/InterviewControls';
import QuestionDisplay from '@/components/interview/QuestionDisplay';
import InterviewTimer from '@/components/interview/InterviewTimer';
import NavBar from '@/components/auth/NavBar';
import AuthModal from '@/components/auth/AuthModal';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

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
  const [meetID, setMeetID] = useState<string | null>(null);
  
  // Cookie helpers
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
  };

  const getCookie = (name: string) => {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  };

  const deleteCookie = (name: string) => {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  };

  // Auth state initialized from cookie
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = getCookie('user_session');
    try {
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  // Real-time audio analysis
  const { volumeLevel } = useAudioAnalyzer(isInterviewActive && isMicOn);
  
  // Speech recognition - sends transcripts to backend for grammar checking
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const handleAiResponse = useCallback((text: string, isDone: boolean) => {
    setAiMessage(text);
    
    if (isDone) {
      // Stop any ongoing speech and play the incoming AI response
      try {
        window.speechSynthesis.cancel();
      } catch (e) { /* ignore */ }

      setStatus('speaking');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setStatus('listening');
        // Do not clear AI message so it stays visible
      };

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useSpeechRecognition(isInterviewActive && isMicOn, meetID ?? undefined, handleAiResponse);

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

  const handleStartInterview = useCallback(async () => {
    // Check if user is logged in before starting interview
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      // Generate random 15-20 char hash for meetID
      const generatedMeetID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Call backend to create meet
      await api.createMeet(generatedMeetID);

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch welcome message
      const welcomeData = await api.welcome(generatedMeetID);
      setWelcomeMessage(welcomeData.message);

      // Speak the welcome message
      const utterance = new SpeechSynthesisUtterance(welcomeData.message);
      window.speechSynthesis.speak(utterance);
      
      // store meetID so speech hook can include it in the WebSocket
      setMeetID(generatedMeetID);

      setIsInterviewActive(true);
      setCurrentQuestionIndex(0);
      setStatus('speaking');
    } catch (error) {
      console.error('Failed to start interview:', error);
      // Optionally handle error (e.g. show toast)
    }
  }, [user]);

  const handleEndInterview = useCallback(() => {
    setIsInterviewActive(false);
    setCurrentQuestionIndex(0);
    setStatus('idle');
    setMeetID(null);
  }, []);

  const handleToggleMic = useCallback(() => {
    setIsMicOn(prev => !prev);
  }, []);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOn(prev => !prev);
  }, []);

  const handleAuthSuccess = useCallback((authUser: { name: string; email: string }) => {
    setUser(authUser);
    setCookie('user_session', JSON.stringify(authUser), 7);
    setIsAuthModalOpen(false);
  }, []);

  const handleSignOut = useCallback(() => {
    setUser(null);
    deleteCookie('user_session');
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex flex-col bg-background relative"
      >
        {/* Header with Timer LEFT and Sign In RIGHT */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border z-20">
          {/* Left side - Logo and Timer */}
          <div className="flex items-center gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">InterviewAI</h1>
                <p className="text-xs text-muted-foreground">Professional Interview Platform</p>
              </div>
            </motion.div>

            {/* Timer on the left side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <InterviewTimer isActive={isInterviewActive} />
            </motion.div>
          </div>

          {/* Right side - Auth Navigation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <NavBar
              user={user}
              onSignInClick={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
            />
          </motion.div>
        </header>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Left side - AI Interviewer */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border bg-gradient-to-br from-primary/[0.02] to-accent/[0.02]"
          >
            <div className="w-full max-w-md space-y-10">
              <AIAvatar 
                isSpeaking={status === 'speaking'} 
                status={status}
              />
              
              <QuestionDisplay
                question={aiMessage || welcomeMessage || INTERVIEW_QUESTIONS[currentQuestionIndex]}
                isActive={isInterviewActive}
              />
            </div>
          </motion.div>

          {/* Right side - User Camera */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 bg-secondary/50"
          >
            <UserCamera
              isActive={isInterviewActive}
              isCameraOn={isCameraOn}
              isRecording={isInterviewActive}
              userName="Candidate"
            />
          </motion.div>
        </main>

        {/* Bottom controls */}
        <motion.footer 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-4 md:p-6 border-t border-border bg-card"
        >
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
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;
