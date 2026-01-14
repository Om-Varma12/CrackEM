import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mic, Video, Brain } from "lucide-react";

import AuthModal from "@/components/auth/AuthModal";
import { useAuthStore } from "@/store/authStore";

const Home = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const login = useAuthStore((state) => state.login);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const navigate = useNavigate();

    const handleAuthSuccess = useCallback(
        (user: { name: string; email: string }) => {
            login(user);
            setIsAuthModalOpen(false);
            navigate("/interview");
        },
        [login, navigate]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-semibold tracking-tight">
                        CrackEM
                    </span>
                </motion.div>

                
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl"
                >
                    Practice Interviews with an
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {" "}AI Interviewer
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-4 text-muted-foreground text-lg max-w-xl"
                >
                    Real-time voice, camera, and AI-driven feedback to help you
                    prepare confidently for your next interview.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full"
                >
                    {[
                        { icon: Mic, label: "Live Voice Analysis" },
                        { icon: Video, label: "Camera-based Interview" },
                        { icon: Brain, label: "AI Feedback & Scoring" },
                    ].map(({ icon: Icon, label }) => (
                        <div
                            key={label}
                            className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 flex flex-col items-center gap-3 shadow-sm"
                        >
                            <Icon className="w-6 h-6 text-primary" />
                            <span className="text-sm font-medium">{label}</span>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12"
                >
                    <button
                        onClick={() => isAuthenticated ? navigate("/interview") :setIsAuthModalOpen(true) }
                        className="px-10 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        Sign in & Start Interview
                    </button>

                </motion.div>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthSuccess={handleAuthSuccess}
            />
        </div>
    );
};

export default Home;
