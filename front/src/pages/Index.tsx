import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AIAvatar from "@/components/interview/AIAvatar";
import UserCamera from "@/components/interview/UserCamera";
import InterviewControls from "@/components/interview/InterviewControls";
import QuestionDisplay from "@/components/interview/QuestionDisplay";
import InterviewTimer from "@/components/interview/InterviewTimer";
import NavBar from "@/components/auth/NavBar";

import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Describe a challenging project you've worked on.",
  "How do you approach learning new technologies?",
  "Tell me about a difficult team situation.",
  "What is your greatest professional achievement?",
];

type InterviewStatus = "idle" | "speaking" | "listening";

// Helper: extract `question` field if incoming AI message is JSON
const extractQuestion = (msg: string | null) => {
  if (!msg) return msg;
  // quick heuristic: try parse if it looks like JSON
  const looksLikeJson = msg.trim().startsWith("{") || msg.trim().startsWith("[");
  if (!looksLikeJson) return msg;
  try {
    const parsed = JSON.parse(msg);
    if (parsed && typeof parsed === "object" && "question" in parsed) {
      const q = (parsed as any).question;
      return typeof q === "string" ? q : JSON.stringify(q);
    }
    return msg;
  } catch (e) {
    return msg;
  }
};

const Index = () => {

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleSignOut = useCallback(() => {
    logout();
    navigate("/", { replace: true }); // back to StartPage
  }, [logout, navigate]);


  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [meetID, setMeetID] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  const { volumeLevel } = useAudioAnalyzer(isInterviewActive && isMicOn);

  /* =====================
     AI / SPEECH HANDLING
  ====================== */
  const handleAiResponse = useCallback((text: string, done: boolean) => {
    setAiMessage(text);

    if (done) {
      // Use the extracted question text for TTS (fallback to raw text)
      const speakText = extractQuestion(text) || text;

      window.speechSynthesis.cancel();
      setStatus("speaking");

      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.onend = () => setStatus("listening");
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const currentQuestion = extractQuestion(aiMessage) ||
    extractQuestion(welcomeMessage) ||
    INTERVIEW_QUESTIONS[currentQuestionIndex];

  useSpeechRecognition(
    isInterviewActive && isMicOn,
    meetID ?? undefined,
    handleAiResponse,
    currentQuestion
  );

  /* =====================
     INTERVIEW ACTIONS
  ====================== */
  const handleStartInterview = useCallback(async () => {
    try {
      const generatedMeetID =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);

      await api.createMeet(generatedMeetID);
      await new Promise((r) => setTimeout(r, 1500));

      const welcome = await api.welcome(generatedMeetID);
      setWelcomeMessage(welcome.message);

      const utterance = new SpeechSynthesisUtterance(welcome.message);
      window.speechSynthesis.speak(utterance);

      setMeetID(generatedMeetID);
      setIsInterviewActive(true);
      setCurrentQuestionIndex(0);
      setStatus("speaking");
    } catch (e) {
      console.error("Failed to start interview", e);
    }
  }, []);

  const handleEndInterview = useCallback(() => {
    setIsInterviewActive(false);
    setCurrentQuestionIndex(0);
    setStatus("idle");
    setMeetID(null);
    setAiMessage(null);
    setWelcomeMessage(null);
  }, []);



  /* =====================
     RENDER
  ====================== */
  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen flex flex-col bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Sparkles className="text-primary" />
            <InterviewTimer isActive={isInterviewActive} />
          </div>

          <NavBar
            user={user}
            onSignInClick={() => { }}
            onSignOut={handleSignOut}
          />
        </header>

        {/* MAIN */}
        <main className="flex flex-1">
          {/* AI SIDE */}
          <div className="flex-1 flex items-center justify-center border-r border-border">
            <div className="max-w-md space-y-8">
              <AIAvatar isSpeaking={status === "speaking"} status={status} />

              <QuestionDisplay
                question={
                  extractQuestion(aiMessage) ||
                  extractQuestion(welcomeMessage) ||
                  INTERVIEW_QUESTIONS[currentQuestionIndex]
                }
                isActive={isInterviewActive}
              />
            </div>
          </div>

          {/* USER CAMERA SIDE */}
          <div className="flex-1 flex items-center justify-center bg-secondary/50">
            <UserCamera
              isActive={isInterviewActive}
              isCameraOn={isCameraOn}
              isRecording={isInterviewActive}
              userName={user?.name ?? "Candidate"}
            />
          </div>
        </main>

        {/* CONTROLS */}
        <footer className="border-t border-border p-4">
          <InterviewControls
            isInterviewActive={isInterviewActive}
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            onToggleMic={() => setIsMicOn((v) => !v)}
            onToggleCamera={() => setIsCameraOn((v) => !v)}
            volumeLevel={volumeLevel}
          />
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;
