import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useClassroom } from '../context/ClassroomContext';
import { Student } from '../types';
import { sounds } from '../utils/audio';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Clock,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  History,
  RotateCw,
  Trophy,
  Coins,
  Smile,
  Sliders,
  CheckCircle2,
  Users,
  X
} from 'lucide-react';

/**
 * Web Audio API cheerful crystalline "ting" sound
 * Synthesizes a high-frequency bell chime with harmonic overtone and exponential decay
 */
const playTingSoundWebAudio = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Primary crystal chime tone: E6 (1318.5 Hz) gliding up to C7 (2093 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);
    osc1.frequency.exponentialRampToValueAtTime(2093.0, now + 0.04);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    // Sparkle harmonic overtone: E7 (2637 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2637.0, now);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    // Warm resonant undertone: A5 (880 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(880.0, now);
    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 0.9);
    osc2.stop(now + 0.55);
    osc3.stop(now + 0.45);
  } catch (err) {
    console.warn('Web Audio API ting sound error:', err);
  }
};

// Framer Motion variants for clock housing subtle shake
const clockHousingVariants: Variants = {
  idle: {
    x: 0,
    rotate: 0,
    transition: { duration: 0.3 }
  },
  shake: {
    x: [-3, 3, -3, 3, -1.5, 1.5, 0],
    rotate: [-0.8, 0.8, -0.5, 0.5, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

// Framer Motion variants for the physical pendulum rod and golden bob
const pendulumVariants: Variants = {
  idle: {
    rotate: [15, -15, 15],
    transition: {
      repeat: Infinity,
      duration: 2.2,
      ease: 'easeInOut'
    }
  },
  swinging: {
    rotate: [
      0,
      48, -48,
      38, -38,
      28, -28,
      18, -18,
      10, -10,
      4, -4,
      0
    ],
    transition: {
      duration: 3.6,
      ease: [0.25, 1, 0.5, 1]
    }
  },
  winner: {
    rotate: 0,
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

export const PendulumPicker: React.FC = () => {
  const { students, awardCoins, callHistory, recordCallHistory } = useClassroom();

  const [mode, setMode] = useState<'pendulum' | 'wheel'>('pendulum');
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendulumAnimState, setPendulumAnimState] = useState<'idle' | 'shake' | 'swinging' | 'winner'>('idle');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Wheel effect style from user settings
  const [selectedEffect, setSelectedEffect] = useState<string>(
    'Xoáy tròn – Các quả cầu xoáy quanh tâm lồng cầu như cơn lốc'
  );

  // Index of student currently displayed in clock center
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, []);

  // Keyboard accessibility: ESC key to close winner modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWinnerModal) {
        setShowWinnerModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWinnerModal]);

  // Handle Starting the Picker
  const handleStartPick = () => {
    if (isSpinning || students.length === 0) return;
    setIsSpinning(true);
    setSelectedStudent(null);
    setShowWinnerModal(false);

    // Pick random target student
    const randomIndex = Math.floor(Math.random() * students.length);
    const winner = students[randomIndex];

    if (mode === 'pendulum') {
      // Step 1: Subtle clock casing shake
      setPendulumAnimState('shake');
      if (soundEnabled) {
        sounds.playTickTock(true);
      }

      // Step 2: After 500ms shake, trigger physical swinging & student roll
      setTimeout(() => {
        setPendulumAnimState('swinging');

        let step = 0;
        const totalRolls = 32;
        let delay = 40;

        const cycleNames = () => {
          step++;
          setHighlightedIndex((prev) => (prev + 1) % students.length);

          if (soundEnabled && step % 2 === 0) {
            sounds.playTickTock(step % 4 === 0);
          }

          if (step < totalRolls) {
            // Gradually decelerate roll as pendulum swing decays
            if (step > 20) {
              delay += 25;
            } else if (step > 12) {
              delay += 10;
            }
            setTimeout(cycleNames, delay);
          } else {
            // Decayed to stop on winner!
            setHighlightedIndex(randomIndex);
            setPendulumAnimState('winner');
            setTimeout(() => {
              finishPick(winner);
              setPendulumAnimState('idle');
            }, 600);
          }
        };

        cycleNames();
      }, 500);
    } else {
      // MODE: Wheel spin
      const baseRotation = wheelRotation;
      const extraSpins = 5 * 360;
      const sliceDeg = 360 / students.length;
      const targetDeg = baseRotation + extraSpins + (students.length - randomIndex) * sliceDeg;

      setWheelRotation(targetDeg);

      // Sound ticks during spin
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        tickCount++;
        if (soundEnabled) sounds.playWheelTick();
        if (tickCount > 28) clearInterval(tickInterval);
      }, 110);

      setTimeout(() => {
        clearInterval(tickInterval);
        finishPick(winner);
      }, 3500);
    }
  };

  const finishPick = (winner: Student) => {
    setIsSpinning(false);
    setSelectedStudent(winner);
    setShowWinnerModal(true);

    if (soundEnabled) {
      // Cheerful 'ting' sound synthesized via Web Audio API
      playTingSoundWebAudio();
      sounds.playTing();
      sounds.playFanfare();
    }
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    recordCallHistory({
      studentId: winner.id,
      studentName: winner.name,
      studentAvatar: winner.avatar,
      mode: mode,
    });
  };

  const handleAwardQuickBonus = (xu: number) => {
    if (!selectedStudent) return;
    awardCoins(selectedStudent.id, xu, 'Thưởng khi gọi tên ngẫu nhiên');
    if (soundEnabled) {
      playTingSoundWebAudio();
    }
    if (xu >= 5) {
      soundEffects.playBigCoin();
    } else {
      soundEffects.playCoin();
    }
    confetti({ particleCount: 50, spread: 60 });
  };

  const currentDisplayStudent = students[highlightedIndex] || students[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {mode === 'pendulum' ? 'Đồng Hồ Quả Lắc Gọi Tên' : 'Vòng Quay May Mắn'}
              </h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Gọi ngẫu nhiên & Tuyên dương công bằng</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Chuyển động lắc vật lý hồi hộp, chọn ngẫu nhiên học sinh trong lớp 5B.2 phát biểu, chữa bài hoặc nhận thưởng!
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
              <button
                onClick={() => {
                  if (!isSpinning) setMode('pendulum');
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                  mode === 'pendulum'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⏰ Quả Lắc Đồng Hồ
              </button>
              <button
                onClick={() => {
                  if (!isSpinning) setMode('wheel');
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                  mode === 'wheel'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎡 Vòng Quay Lồng Cầu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left & Center: The Picker Stage */}
        <div className="lg:col-span-2 bg-gradient-to-b from-indigo-50/70 via-white to-purple-50/50 rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 shadow-sm flex flex-col items-center justify-between min-h-[520px] relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-amber-200/30 via-pink-200/20 to-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Stage Indicator */}
          <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500 mb-4 z-10">
            <span className="flex items-center space-x-1.5 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-indigo-100 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sẵn sàng gọi: {students.length} học sinh</span>
            </span>

            <span className="text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full font-black">
              {mode === 'pendulum'
                ? '⏳ Nhịp đập quả lắc cơ học'
                : `✨ Hiệu ứng: ${selectedEffect.split('–')[0]}`}
            </span>
          </div>

          {/* MODE 1: GRANDFATHER PENDULUM CLOCK (Framer Motion Enhanced) */}
          {mode === 'pendulum' ? (
            <div className="flex flex-col items-center my-2 relative z-10">
              {/* Ornate Wooden Clock Housing with Subtle Shake on Start */}
              <motion.div
                variants={clockHousingVariants}
                animate={pendulumAnimState === 'shake' ? 'shake' : 'idle'}
                className="w-64 sm:w-72 bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 p-4 rounded-[40px] shadow-2xl border-4 border-amber-700/80 text-center relative"
              >
                {/* Clock Face with Golden Rim */}
                <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-400 shadow-inner flex flex-col items-center justify-center relative p-3">
                  <div className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">
                    5B.2 VUI VẺ
                  </div>

                  {/* Highlighted Student in Clock Center */}
                  <motion.div
                    animate={
                      pendulumAnimState === 'swinging'
                        ? { scale: [1, 1.05, 1], rotate: [-1, 1, 0] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.15, repeat: pendulumAnimState === 'swinging' ? Infinity : 0 }}
                    className="w-20 h-20 rounded-full bg-white border-2 border-amber-300 p-1 shadow-md flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={currentDisplayStudent?.avatar}
                      alt={currentDisplayStudent?.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </motion.div>

                  <div className="mt-1 font-extrabold text-xs text-amber-950 truncate max-w-[140px]">
                    {currentDisplayStudent?.name || 'Học sinh may mắn'}
                  </div>
                  <div className="text-[9px] font-bold text-amber-700">
                    🪙 {currentDisplayStudent?.coins || 0} Xu
                  </div>
                </div>

                {/* Pendulum Chamber Window */}
                <div className="w-36 h-48 mx-auto mt-3 bg-slate-950/75 rounded-3xl border-2 border-amber-600/60 p-2 relative overflow-hidden flex justify-center">
                  {/* Swinging Pendulum Rod & Golden Bob driven by Framer Motion */}
                  <motion.div
                    variants={pendulumVariants}
                    animate={
                      pendulumAnimState === 'swinging'
                        ? 'swinging'
                        : pendulumAnimState === 'winner'
                        ? 'winner'
                        : 'idle'
                    }
                    style={{ transformOrigin: 'top center' }}
                    className="w-full h-full flex flex-col items-center"
                  >
                    {/* Metal Rod */}
                    <div className="w-2 h-28 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 shadow-sm" />
                    {/* Golden Shiny Bob */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-2 border-amber-200 shadow-xl flex items-center justify-center text-amber-950 font-black text-xs">
                      ⭐ 5B.2
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* MODE 2: THE LUCKY WHEEL (LỒNG CẦU MAY MẮN) */
            <div className="relative my-4 z-10 flex flex-col items-center">
              {/* Pointer indicator at top */}
              <div className="w-8 h-8 -mb-4 z-30 bg-red-600 clip-triangle shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-black">▼</span>
              </div>

              {/* Spinning Wheel Body */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg) translateZ(0)`,
                  willChange: isSpinning ? 'transform' : 'auto',
                  transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                }}
                className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-indigo-500 bg-white shadow-2xl relative overflow-hidden flex items-center justify-center"
              >
                {/* Visual Segments */}
                {students.map((st, idx) => {
                  const deg = (360 / students.length) * idx;
                  const colors = [
                    'bg-pink-400',
                    'bg-amber-400',
                    'bg-emerald-400',
                    'bg-cyan-400',
                    'bg-purple-400',
                    'bg-rose-400',
                    'bg-blue-400',
                  ];
                  const bgColor = colors[idx % colors.length];

                  return (
                    <div
                      key={st.id}
                      style={{
                        transform: `rotate(${deg}deg)`,
                        transformOrigin: '50% 50%',
                      }}
                      className="absolute w-full h-full flex justify-center pt-2 pointer-events-none"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${bgColor} p-0.5 border border-white shadow-xs`}>
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-800 bg-white/90 px-1 rounded-sm mt-0.5 max-w-[50px] truncate shadow-2xs">
                          {st.name.split(' ').slice(-1)[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Center Hub */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-xs z-20">
                  5B.2
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="w-full flex justify-center mt-6 z-10">
            <button
              onClick={handleStartPick}
              disabled={isSpinning || students.length === 0}
              className={`w-full max-w-md py-4 px-8 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 cursor-pointer ${
                isSpinning
                  ? 'bg-slate-400 text-white cursor-not-allowed animate-pulse'
                  : mode === 'pendulum'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white shadow-orange-500/30'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white shadow-indigo-600/30'
              }`}
            >
              {isSpinning ? (
                <>
                  <RotateCw className="w-6 h-6 animate-spin" />
                  <span>Đang lắc quả lắc chọn học sinh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>
                    {mode === 'pendulum' ? 'LẮC QUẢ LẮC GỌI TÊN NGAY' : 'QUAY NGAY VÒNG QUAY'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Settings & Call History */}
        <div className="space-y-6">
          {/* Wheel Effect Settings */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                  Thiết Lập Hiệu Ứng Lồng Cầu
                </h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                7 hiệu ứng
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Chọn hiệu ứng cố định cho lượt quay:
              </label>
              <select
                value={selectedEffect}
                onChange={(e) => setSelectedEffect(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Xoáy tròn – Các quả cầu xoáy quanh tâm lồng cầu như cơn lốc">
                  Xoáy tròn – Các quả cầu xoáy quanh tâm lồng cầu...
                </option>
                <option value="Tung nảy – Các quả cầu bị thổi bật nhẹ nhàng, nảy nhịp nhàng">
                  Tung nảy – Các quả cầu bị thổi bật nhẹ nhàng...
                </option>
                <option value="Hút vào tâm – Chạy nhẹ nhàng rồi từ từ bị hút dồn về tâm lồng">
                  Hút vào tâm – Chạy nhẹ nhàng dồn về tâm...
                </option>
                <option value="Bay theo quỹ đạo – Quả cầu di chuyển thành các vòng cung mềm mại">
                  Bay theo quỹ đạo – Di chuyển vòng cung mềm mại...
                </option>
                <option value="Mưa bóng – Các quả cầu nâng lên rồi rơi xuống như mưa bóng">
                  Mưa bóng – Nâng lên rơi xuống rực rỡ...
                </option>
                <option value="Sân khấu ánh sáng – Spotlight quét qua các quả cầu khóa mục tiêu">
                  Sân khấu ánh sáng – Spotlight quét khóa mục tiêu...
                </option>
                <option value="Sóng bồng bềnh – Các quả cầu nhấp nhô theo làn sóng nhịp nhàng">
                  Sóng bồng bềnh – Nhấp nhô làn sóng nhịp nhàng...
                </option>
              </select>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/60 text-xs text-amber-900 flex items-start space-x-2">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">
                Đồng hồ quả lắc giúp tạo không khí hồi hộp, công bằng và kích thích phản xạ tự giác học tập của học sinh Lớp 5B.2!
              </p>
            </div>
          </div>

          {/* Call History (Lịch Sử Quay) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                  Lịch Sử Gọi Tên ({callHistory.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {callHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={item.studentAvatar}
                      alt={item.studentName}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">
                        {item.studentName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {item.mode === 'pendulum' ? 'Quả lắc' : 'Vòng quay'} • {item.timestamp}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                    Đã gọi
                  </span>
                </div>
              ))}

              {callHistory.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <Smile className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">Chưa có lượt gọi nào</p>
                  <p className="text-[11px] text-slate-400">Bấm nút lắc quả lắc để bắt đầu tiết học nhé!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Celebration Modal (Responsive, Scrollable & With Prominent Close Button) */}
      {showWinnerModal && selectedStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWinnerModal(false);
          }}
          className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
        >
          <div className="relative bg-white rounded-3xl max-w-md w-full my-auto shadow-2xl border-4 border-amber-300 overflow-hidden text-center max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header with Title and Prominent (X) Close Button */}
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 px-5 py-4 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setShowWinnerModal(false)}
                title="Đóng cửa sổ"
                aria-label="Đóng cửa sổ chúc mừng"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer z-30"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-2xl sm:text-3xl">🎉</span>
              <h2 className="text-xl sm:text-2xl font-black mt-0.5">Xin Chúc Mừng!</h2>
              <p className="text-xs text-white/95 font-bold mt-0.5">
                {mode === 'pendulum' ? 'Quả lắc đồng hồ đã dừng tại em:' : 'Vòng quay may mắn đã chọn:'}
              </p>
            </div>

            {/* Scrollable Student Spotlight & Actions */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div className="w-20 h-20 sm:w-22 sm:h-22 mx-auto rounded-full bg-gradient-to-tr from-amber-300 via-orange-300 to-pink-300 p-1 shadow-lg shrink-0">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-full h-full object-cover rounded-full bg-white"
                  onError={(e) => {
                    // Fallback to neutral avatar
                    (e.target as HTMLImageElement).src =
                      'https://api.dicebear.com/7.x/bottts/svg?seed=' + selectedStudent.id;
                  }}
                />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Lớp 5B.2 Vui Vẻ • Cô Kim Tiến Number Hi! •{' '}
                  {selectedStudent.row ? `Bàn Hàng ${selectedStudent.row}` : 'Lớp học'}
                </p>
                <div className="inline-flex items-center space-x-1 mt-1.5 bg-amber-100 text-amber-900 font-black text-xs px-3 py-1 rounded-full border border-amber-200">
                  <span>🪙 Đang có {selectedStudent.coins} xu thưởng</span>
                </div>
              </div>

              {/* Bonus award actions */}
              <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/80 space-y-2 text-left">
                <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide text-center">
                  Tuyên dương & Trao thưởng ngay
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAwardQuickBonus(2)}
                    className="py-2.5 px-3 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs flex items-center justify-center space-x-1 active:scale-95 transition-transform cursor-pointer shadow-2xs"
                  >
                    <span>⭐ +2 Xu Tự Tin</span>
                  </button>
                  <button
                    onClick={() => handleAwardQuickBonus(5)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black text-xs flex items-center justify-center space-x-1 active:scale-95 transition-transform shadow-sm cursor-pointer"
                  >
                    <span>🪙 +5 Xu Trả Lời Tốt</span>
                  </button>
                </div>
              </div>

              {/* Close Button Inside Scrollable View */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Đóng & Tiếp Tục Tiết Học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
