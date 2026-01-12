import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPasswordVisible, setSignInPasswordVisible] = useState(false);

  // Sign Up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasswordVisible, setSignUpPasswordVisible] = useState(false);
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpConfirmPasswordVisible, setSignUpConfirmPasswordVisible] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateSignIn = () => {
    const newErrors: FormErrors = {};

    if (!signInEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signInEmail)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!signInPassword) {
      newErrors.password = 'Password is required';
    } else if (signInPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = () => {
    const newErrors: FormErrors = {};

    if (!signUpName.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!signUpEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signUpEmail)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!signUpPassword) {
      newErrors.password = 'Password is required';
    } else if (signUpPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!signUpConfirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signUpPassword !== signUpConfirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await api.signin({
        email: signInEmail,
        password: signInPassword,
      });

      if (response.status === 'success' && response.user) {
        onAuthSuccess(response.user);
        onClose();
      } else {
        setErrors({ 
          email: response.message || 'Invalid credentials',
          password: response.message || 'Invalid credentials'
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ 
        email: 'Network error. Please try again.',
        password: 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await api.signup({
        username: signUpName,
        email: signUpEmail,
        password: signUpPassword,
      });

      if (response.status === 'success') {
        setSuccessMessage(response.message || 'Account created successfully! You can now sign in.');
        
        setTimeout(() => {
          setActiveTab('signin');
          setSuccessMessage('');
          setSignInEmail(signUpEmail);
        }, 2000);
      } else {
        setErrors({ 
          email: response.message || 'Sign up failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ 
        email: 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    onAuthSuccess({ name: 'Google User', email: 'user@gmail.com' });
    onClose();
  };

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setSignInPasswordVisible(false);
    setSignUpName('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpPasswordVisible(false);
    setSignUpConfirmPassword('');
    setSignUpConfirmPasswordVisible(false);
    setAgreeTerms(false);
    setErrors({});
    setSuccessMessage('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const getFieldDelay = (index: number) => index * 0.08;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
        >
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-xl font-semibold text-center text-foreground">
              Welcome to InterviewAI
            </DialogTitle>
          </DialogHeader>

          {/* Custom Tabs */}
          <div className="w-full">
            <div className="grid grid-cols-2 mx-6 mt-4 p-1 bg-muted rounded-md" style={{ width: 'calc(100% - 48px)' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('signin')}
                className={`relative py-1.5 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === 'signin' 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === 'signin' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('signup')}
                className={`relative py-1.5 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === 'signup' 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === 'signup' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Sign Up</span>
              </motion.button>
            </div>

            <div className="p-6">
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm"
                >
                  {successMessage}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {activeTab === 'signin' ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(0) }}
                        className="space-y-2"
                      >
                        <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary transition-all duration-200"
                          />
                        </div>
                        {errors.email && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.email}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(1) }}
                        className="space-y-2"
                      >
                        <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type={signInPasswordVisible ? "text" : "password"}
                            placeholder="Enter your password"
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                            className="pl-10 pr-10 bg-secondary border-border focus:border-primary focus:ring-primary transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setSignInPasswordVisible(!signInPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={signInPasswordVisible ? "Hide password" : "Show password"}
                          >
                            {signInPasswordVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.password && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.password}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(2) }}
                        className="flex items-center justify-between"
                      >
                        <button type="button" className="text-sm text-primary hover:underline">
                          Forgot password?
                        </button>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(3) }}
                      >
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Sign In
                          </Button>
                        </motion.div>
                      </motion.div>
                    </form>

                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: getFieldDelay(4) }}
                      className="relative my-4"
                    >
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: getFieldDelay(5) }}
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-border hover:bg-secondary"
                          onClick={handleGoogleAuth}
                          disabled={isLoading}
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign in with Google
                        </Button>
                      </motion.div>
                    </motion.div>

                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: getFieldDelay(6) }}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Don't have an account?{' '}
                      <button
                        type="button"
                        className="text-primary hover:underline font-medium"
                        onClick={() => setActiveTab('signup')}
                      >
                        Sign Up
                      </button>
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(0) }}
                        className="space-y-2"
                      >
                        <Label htmlFor="signup-name" className="text-sm font-medium text-foreground">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={signUpName}
                            onChange={(e) => setSignUpName(e.target.value)}
                            className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary transition-all duration-200"
                          />
                        </div>
                        {errors.name && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.name}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(1) }}
                        className="space-y-2"
                      >
                        <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary transition-all duration-200"
                          />
                        </div>
                        {errors.email && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.email}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(2) }}
                        className="space-y-2"
                      >
                        <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={signUpPasswordVisible ? "text" : "password"}
                            placeholder="Create a password"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            className="pl-10 pr-10 bg-secondary border-border focus:border-primary focus:ring-primary transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setSignUpPasswordVisible(!signUpPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={signUpPasswordVisible ? "Hide password" : "Show password"}
                          >
                            {signUpPasswordVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.password && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.password}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(3) }}
                        className="space-y-2"
                      >
                        <Label htmlFor="signup-confirm" className="text-sm font-medium text-foreground">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-confirm"
                            type={signUpConfirmPasswordVisible ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={signUpConfirmPassword}
                            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                            className="pl-10 pr-10 bg-secondary border-border focus:border-primary focus:ring-primary transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setSignUpConfirmPasswordVisible(!signUpConfirmPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={signUpConfirmPasswordVisible ? "Hide password" : "Show password"}
                          >
                            {signUpConfirmPasswordVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.confirmPassword}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(4) }}
                        className="space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="terms"
                            checked={agreeTerms}
                            onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                            className="mt-0.5"
                          />
                          <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                            I agree to the{' '}
                            <button type="button" className="text-primary hover:underline">Terms & Conditions</button>
                          </Label>
                        </div>
                        {errors.terms && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{errors.terms}</motion.p>}
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: getFieldDelay(5) }}
                      >
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Account
                          </Button>
                        </motion.div>
                      </motion.div>
                    </form>

                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: getFieldDelay(6) }}
                      className="relative my-4"
                    >
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: getFieldDelay(7) }}
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-border hover:bg-secondary"
                          onClick={handleGoogleAuth}
                          disabled={isLoading}
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign up with Google
                        </Button>
                      </motion.div>
                    </motion.div>

                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: getFieldDelay(8) }}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="text-primary hover:underline font-medium"
                        onClick={() => setActiveTab('signin')}
                      >
                        Sign In
                      </button>
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
