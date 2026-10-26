import React, { useState } from 'react';
import { Worksheet } from '../types';
import { useClassroom } from '../context/ClassroomContext';
import { sounds } from '../utils/audio';
import { soundEffects } from '../utils/soundEffects';
import { triggerFireworksCelebration } from '../utils/fireworks';
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ArrowLeft,
  Flame
} from 'lucide-react';

interface InteractiveQuizPlayerProps {
  worksheet: Worksheet;
  onClose: () => void;
  onCompletePass?: (worksheet: Worksheet, percent: number, coins: number) => void;
}

export const InteractiveQuizPlayer: React.FC<InteractiveQuizPlayerProps> = ({
  worksheet,
  onClose,
  onCompletePass,
}) => {
  const { submitWorksheetResult, currentStudent } = useClassroom();
  const questions = worksheet.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percent: number;
    isPassed: boolean;
    coinsAwarded: number;
  } | null>(null);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
    sounds.playCoin();
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.answerIndex) {
        correctCount++;
      }
    });

    const res = submitWorksheetResult(
      worksheet,
      selectedAnswers,
      correctCount,
      questions.length
    );

    setResult({
      score: correctCount,
      total: questions.length,
      percent: res.percent,
      isPassed: res.isPassed,
      coinsAwarded: res.coinsAwarded,
    });
    setIsSubmitted(true);

    // If score >= 80%, play celebratory fanfare and launch multi-stage fireworks confetti celebration!
    if (res.percent >= 80 || res.isPassed) {
      soundEffects.playWorksheetComplete();
      triggerFireworksCelebration();
      if (onCompletePass) {
        onCompletePass(worksheet, res.percent, res.coinsAwarded);
      }
    } else {
      soundEffects.playCoin();
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setResult(null);
    setCurrentIndex(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-indigo-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📝</span>
            <div>
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                {worksheet.subject} • {worksheet.grade}
              </span>
              <h2 className="text-base sm:text-lg font-black truncate max-w-md sm:max-w-xl">
                {worksheet.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!isSubmitted ? (
            <>
              {/* Progress Bar & Question Counter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    Câu hỏi {currentIndex + 1} / {questions.length}
                  </span>
                  <span>Đã trả lời {answeredCount} câu</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border">
                  <div
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs shrink-0 transition-all ${
                      currentIndex === idx
                        ? 'bg-indigo-600 text-white shadow-md'
                        : selectedAnswers[q.id] !== undefined
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Question Box */}
              {currentQ && (
                <div className="bg-indigo-50/50 rounded-3xl p-5 border-2 border-indigo-100 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base sm:text-xl font-extrabold text-slate-800 leading-relaxed">
                      {currentQ.question}
                    </h3>
                    <button
                      onClick={() => sounds.speakVietnamese(currentQ.question)}
                      title="Đọc câu hỏi cho em nghe"
                      className="p-2.5 rounded-2xl bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-2xs transition-colors shrink-0"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;
                      const letters = ['A', 'B', 'C', 'D'];

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`flex items-center space-x-3 p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.01]'
                              : 'bg-white hover:bg-indigo-50/70 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {letters[optIdx]}
                          </div>
                          <span className="font-bold text-sm sm:text-base flex-1">
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Câu trước
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                  >
                    Câu tiếp theo
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                  >
                    Nộp Bài & Tự Động Chấm Điểm
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Submission Results Screen */
            result && (
              <div className="space-y-6 animate-in zoom-in-95 duration-200">
                {/* Result Hero Banner */}
                <div
                  className={`rounded-3xl p-6 sm:p-8 text-center text-white relative overflow-hidden shadow-xl ${
                    result.isPassed
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                >
                  <div className="text-4xl sm:text-5xl mb-2">
                    {result.isPassed ? '🎉 🏆' : '💪 ⭐'}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    {result.isPassed ? 'Xuất Sắc! Bé Đã Đạt Chuẩn Thưởng!' : 'Bé Đã Cố Gắng Rất Nhiều!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 font-bold mt-1">
                    {result.isPassed
                      ? `Đạt ${result.percent}% (Từ 80% trở lên) — Hệ thống tự động cộng ${result.coinsAwarded} Xu vào tài khoản!`
                      : `Đạt ${result.percent}% (Cần đạt từ 80% để nhận trọn vẹn điểm thưởng). Hãy xem lại bài và làm lại nhé!`}
                  </p>

                  <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-md rounded-2xl px-5 py-2.5 mt-4 text-sm font-black">
                    <span>Đúng: {result.score} / {result.total} câu</span>
                    <span>•</span>
                    <span>Điểm: {result.percent}%</span>
                    <span>•</span>
                    <span>🪙 +{result.coinsAwarded} Xu thưởng</span>
                  </div>
                </div>

                {/* Review Answer Explanations */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider">
                    Chi tiết bài làm & Lời giải thích từ thầy cô:
                  </h4>

                  {questions.map((q, idx) => {
                    const studentAns = selectedAnswers[q.id];
                    const isCorrect = studentAns === q.answerIndex;

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl p-4 border-2 ${
                          isCorrect
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/60 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-bold text-sm">
                              Câu {idx + 1}: {q.question}
                            </h5>
                            <p className="text-xs font-semibold mt-1">
                              Đáp án của em:{' '}
                              <strong>
                                {studentAns !== undefined ? q.options[studentAns] : 'Chưa chọn'}
                              </strong>
                            </p>
                            {!isCorrect && (
                              <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                Đáp án đúng: {q.options[q.answerIndex]}
                              </p>
                            )}
                            <div className="bg-white/80 rounded-xl p-2.5 mt-2 border text-xs text-slate-600 font-medium">
                              💡 <strong>Giải thích:</strong> {q.explanation}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                  <button
                    onClick={handleRetry}
                    className="flex-1 min-w-[140px] py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Làm lại bài</span>
                  </button>

                  {result.isPassed && (
                    <button
                      onClick={() => triggerFireworksCelebration()}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black text-sm flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <span>Bắn Thêm Pháo Hoa 🎆</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (result.isPassed && onCompletePass) {
                        onCompletePass(worksheet, result.percent, result.coinsAwarded);
                      }
                      onClose();
                    }}
                    className="flex-1 min-w-[160px] py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-colors"
                  >
                    Hoàn Tất & Về Lớp Học
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
