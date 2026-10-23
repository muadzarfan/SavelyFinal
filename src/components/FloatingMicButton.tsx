import React, { useState, useEffect } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface FloatingMicButtonProps {
  onClick: () => void;
  language: Language;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
  onClick,
  language,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const t = translations[language];

  // Auto-hide slightly when scrolling rapidly downwards, re-appear when stopping or scrolling up
  useEffect(() => {
    let timeout: any;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 50 && currentScrollY > 150) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 20 || currentScrollY < 100) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsVisible(true);
      }, 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [lastScrollY]);

  return (
    <div
      className={`fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-40 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-40 scale-90 pointer-events-none'
      }`}
    >
      <button
        id="primary-floating-voice-btn"
        type="button"
        onClick={onClick}
        className="group relative flex h-14 sm:h-16 items-center space-x-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 pl-4 pr-5 sm:pl-5 sm:pr-6 text-emerald-950 font-bold shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_rgba(52,211,153,0.7)] hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
        aria-label={t.speakExpense}
        title={t.speakExpense}
      >
        <span className="absolute -inset-1 rounded-full bg-emerald-400/20 blur-md animate-pulse" />
        <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-950/20 text-emerald-950">
          <Mic className="h-5 w-5 animate-bounce-gentle" />
        </div>
        <span className="relative text-xs sm:text-sm tracking-tight font-display font-extrabold uppercase sm:capitalize">
          {t.speakExpense}
        </span>
      </button>
    </div>
  );
};
