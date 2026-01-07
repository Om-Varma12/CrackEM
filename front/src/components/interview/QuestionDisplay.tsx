import { useEffect, useState, useRef } from 'react';

interface QuestionDisplayProps {
  question: string;
  isActive: boolean;
}

const QuestionDisplay = ({ 
  question, 
  isActive 
}: QuestionDisplayProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Typewriter effect
  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < question.length) {
        setDisplayedText(question.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [question, isActive]);

  // Auto-scroll to bottom when text updates
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [displayedText]);

  if (!isActive) {
    return (
      <div className="glass-panel-strong p-6 md:p-8 text-center">
        <p className="text-muted-foreground">
          Click "Start Interview" to begin your session
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel-strong p-6 md:p-8 animate-scale-in">
      {/* Question text with fixed height and auto-scroll */}
      <div 
        ref={textRef}
        className="h-[100px] overflow-y-auto scrollbar-hide flex items-start"
      >
        <p className="question-text leading-relaxed">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
};

export default QuestionDisplay;
