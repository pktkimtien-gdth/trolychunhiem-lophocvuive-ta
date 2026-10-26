import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Student } from '../../types';
import { DAILY_AFFIRMATIONS, Affirmation, getAffirmationForToday } from '../../data/affirmationsData';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Quote,
  Flame,
  SunMedium
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../utils/soundEffects';

interface DailyAffirmationsProps {
  student: Student;
  onClose?: () => void;
  className?: string;
  defaultCollapsed?: boolean;
}

export const DailyAffirmations: React.FC<DailyAffirmationsProps> = ({
  student,
  onClose,
  className = '',
  defaultCollapsed = false,
}) => {
  // Determine initial affirmation based on today's calendar date
  const [currentIndex, setCurrentIndex] = useState(() => {
    const today = getAffirmationForToday();
    const idx = DAILY_AFFIRMATIONS.findIndex((a) => a.id === today.id);
    return idx >= 0 ? idx : 0;
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [animationClass, setAnimationClass] = useState('opacity-100 translate-y-0');

  // Energy/acceptance streak tracker stored in localStorage
  const storageKey = `affirmation_energy_${student.id}`;
  const [hasReceivedEnergy, setHasReceivedEnergy] = useState(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem(storageKey);
      return saved === todayStr;
    } catch {
      return false;
    }
  });

  const [streakCount, setStreakCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`affirmation_streak_${student.id}`);
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  const currentAffirmation: Affirmation = DAILY_AFFIRMATIONS[currentIndex] || DAILY_AFFIRMATIONS[0];
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transition helper when changing quote
  const changeQuoteWithAnimation = useCallback((newIndex: number) => {
    setAnimationClass('opacity-0 -translate-y-2');
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setAnimationClass('opacity-100 translate-y-0');
    }, 180);
  }, []);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % DAILY_AFFIRMATIONS.length;
    changeQuoteWithAnimation(nextIdx);
  }, [currentIndex, changeQuoteWithAnimation]);

  const handlePrev = useCallback(() => {
    const prevIdx = (currentIndex - 1 + DAILY_AFFIRMATIONS.length) % DAILY_AFFIRMATIONS.length;
    changeQuoteWithAnimation(prevIdx);
  }, [currentIndex, changeQuoteWithAnimation]);

  const handleRandom = useCallback(() => {
    soundEffects.playCoin();
    let rand = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    if (rand === currentIndex && DAILY_AFFIRMATIONS.length > 1) {
      rand = (rand + 1) % DAILY_AFFIRMATIONS.length;
    }
    changeQuoteWithAnimation(rand);
  }, [currentIndex, changeQuoteWithAnimation]);

  // Auto-rotate every 12 seconds when autoPlay is enabled and user is not hovering
  useEffect(() => {
    if (!isAutoPlay || isHovered || isCollapsed) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 12000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, isHovered, isCollapsed, handleNext]);

  // Web Speech API to read aloud in Vietnamese
  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${currentAffirmation.quote}. ${currentAffirmation.reflectionPrompt}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95; // Gentle and clear pace for students
    utterance.pitch = 1.05;

    // Try finding Vietnamese voice if available in browser
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.startsWith('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speech if unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Positive Energy & Confetti Burst
  const handleReceiveEnergy = () => {
    soundEffects.playBigCoin();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f43f5e', '#a855f7', '#38bdf8', '#34d399'],
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(storageKey, todayStr);
      if (!hasReceivedEnergy) {
        const newStreak = streakCount + 1;
        setStreakCount(newStreak);
        localStorage.setItem(`affirmation_streak_${student.id}`, newStreak.toString());
      }
    } catch {
      // storage quota or disabled
    }
    setHasReceivedEnergy(true);
  };

  // Copy quote to clipboard
  const handleCopyQuote = async () => {
    try {
      const text = `“${currentAffirmation.quote}” — ${currentAffirmation.author} (Lớp 5B.2 Vui Vẻ)`;
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Collapsed compact bar view
  if (isCollapsed) {
    return (
      <div className={`w-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border border-amber-300/80 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-xs transition-all ${className}`}>
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="text-xl shrink-0 animate-bounce">☀️</span>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 truncate">
            <span className="font-black text-amber-900">Lời nhắn hôm nay cho {student.name}:</span>
            <span className="italic text-slate-700 truncate max-w-xs sm:max-w-md md:max-w-xl">
              “{currentAffirmation.quote}”
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center space-x-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>Mở đầy đủ</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full rounded-3xl overflow-hidden shadow-xl border border-white/20 transition-all select-none ${className}`}
    >
      {/* Background Image with Fallback and Smooth Gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
        style={{
          backgroundImage: `url('${currentAffirmation.bgImage}')`,
        }}
      />

      {/* Layered Rich Gradient Overlay for High Legibility (WCAG AA) */}
      <div className={`absolute inset-0 bg-gradient-to-r ${currentAffirmation.bgGradient} backdrop-blur-[2px] transition-colors duration-500`} />

      {/* Subtle Whimsical Light Particles Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-7 text-white flex flex-col justify-between min-h-[220px]">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-2 border-b border-white/15">
          {/* Student Greeting & Subject Kicker */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner border border-white/30 shrink-0">
              {currentAffirmation.themeEmoji}
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs text-amber-200 font-bold">
                <span>Chào buổi sáng, {student.name}!</span>
                <span aria-hidden="true" className="opacity-60">·</span>
                <span className="flex items-center space-x-1 text-emerald-300">
                  <SunMedium className="w-3.5 h-3.5" />
                  <span>Lời Nhắn Tích Cực Mỗi Ngày</span>
                </span>
                <span aria-hidden="true" className="opacity-60">·</span>
                <span className="text-white/80">Số {currentIndex + 1}/{DAILY_AFFIRMATIONS.length}</span>
              </div>
              <div className="text-[11px] text-white/70 font-medium mt-0.5">
                Chủ đề: <span className="font-bold text-white">{currentAffirmation.category}</span> · {currentAffirmation.author}
              </div>
            </div>
          </div>

          {/* Right Header Actions: Streak & Collapse Button */}
          <div className="flex items-center space-x-2">
            {/* Streak Counter */}
            <div
              title={`Em đã kiên trì đọc lời nhắn tích cực ${streakCount} ngày liên tiếp!`}
              className="flex items-center space-x-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-xs font-black text-amber-300 shadow-inner"
            >
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
              <span>{streakCount} ngày tích cực</span>
            </div>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="Thu gọn lời nhắn"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: The Quote Body with Smooth Animation */}
        <div className={`my-4 sm:my-5 transition-all duration-300 ${animationClass}`}>
          <div className="relative pl-6 sm:pl-8">
            {/* Big Decorative Quotation Mark */}
            <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400/40 absolute -left-1 -top-2 transform -scale-x-100 pointer-events-none" />

            <blockquote className="text-base sm:text-xl md:text-2xl font-black text-white leading-relaxed tracking-tight drop-shadow-md font-['Quicksand',sans-serif]">
              “{currentAffirmation.quote}”
            </blockquote>

            {/* Daily Reflection / Micro-Challenge Prompt */}
            <div className="mt-3 flex items-start space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 max-w-2xl">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-amber-100/95 leading-snug">
                <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] mr-1.5">
                  Thử thách hôm nay:
                </span>
                {currentAffirmation.reflectionPrompt}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/15">
          {/* Left: Rotate & Navigation buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer"
              title="Câu trước đó"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer"
              title="Câu tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleRandom}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Đổi câu ngẫu nhiên"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-300" />
              <span>Đổi câu khác</span>
            </button>

            <button
              onClick={handleReadAloud}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isSpeaking ? 'Dừng đọc' : 'Nghe đọc câu châm ngôn'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Dừng</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Nghe đọc</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyQuote}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer"
              title="Sao chép câu truyền cảm hứng này"
            >
              {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Receive Positive Energy Action */}
          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={handleReceiveEnergy}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
                hasReceivedEnergy
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 shadow-amber-500/30 animate-pulse'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasReceivedEnergy ? 'fill-white text-white' : 'fill-slate-950 text-slate-950'}`} />
              <span>{hasReceivedEnergy ? 'Đã nhận năng lượng hôm nay! 💖' : 'Đón nhận năng lượng! ✨'}</span>
            </button>
          </div>
        </div>

        {/* Auto-rotation indicator bar */}
        {isAutoPlay && !isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-pink-400 animate-[pulse_12s_ease-in-out_infinite]" />
          </div>
        )}
      </div>
    </div>
  );
};
