import React, { useState } from 'react';
import { ClassTask, Student, InteractiveTaskQuestion } from '../../types';
import { useClassroom } from '../../context/ClassroomContext';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Send,
  Eye,
  Check,
  Award
} from 'lucide-react';

interface InteractiveTaskModalProps {
  task: ClassTask;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveTaskModal: React.FC<InteractiveTaskModalProps> = ({
  task,
  student,
  isOpen,
  onClose,
}) => {
  const { submitStudentTaskAnswers } = useClassroom();
  const existingRecord = task.studentRecords[student.id];

  // User answers state (questionId -> answer string/value)
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    return existingRecord?.answers || {};
  });

  // Self declaration state for external link tasks
  const [selfDeclaredNote, setSelfDeclaredNote] = useState<string>(() => {
    return existingRecord?.selfDeclaredNote || '';
  });

  // Active question index if multiple questions
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Show hints state (qId -> boolean)
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // Submission state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);

  if (!isOpen) return null;

  const questions: InteractiveTaskQuestion[] = task.questions || [];
  const isExternal = task.taskType === 'external_link' || !!task.externalUrl;
  const isShortEssay = task.taskType === 'short_essay';
  const isAlreadyCompleted = existingRecord?.status === 'completed';
  const isAlreadySubmitted = existingRecord?.status === 'submitted';

  // Toggle reveal hint
  const handleToggleHint = (qId: string) => {
    soundEffects.playClick();
    setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Ask AI for pedagogical concept hint
  const handleAskAIExplanation = async (q: InteractiveTaskQuestion) => {
    setAiExplaining(true);
    setAiExplanationText(null);
    try {
      const res = await fetch('/api/ai/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: task.subject,
          topic: task.title,
          studentQuestion: `Giải thích kiến thức liên quan đến câu hỏi: "${q.prompt}"`,
        }),
      });
      const data = await res.json();
      setAiExplanationText(data.explanation || 'Hãy đọc kỹ đề bài và áp dụng quy tắc đã học nhé!');
      soundEffects.playCorrect();
    } catch {
      setAiExplanationText('💡 Gợi ý: Hãy nhớ lại bài giảng trên lớp của cô Kim Tiến và thử suy luận từ các dữ kiện đã biết nhé!');
    } finally {
      setAiExplaining(false);
    }
  };

  // Handle Answer selection
  const handleSelectOption = (qId: string, option: string) => {
    soundEffects.playClick();
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    setValidationError(null);
  };

  const handleFillInChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setValidationError(null);
  };

  // Submit Homework Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // If task has questions, check all required answers
    if (questions.length > 0) {
      const unanswered = questions.filter((q) => {
        const val = answers[q.id];
        return val === undefined || String(val).trim() === '';
      });

      if (unanswered.length > 0) {
        soundEffects.playWrong();
        setValidationError(`Em còn ${unanswered.length} câu hỏi chưa làm xong. Hãy hoàn thành tất cả các câu trước khi nộp nhé!`);
        return;
      }
    }

    setValidationError(null);

    // Call Context to update answers and status
    submitStudentTaskAnswers(
      task.id,
      student.id,
      answers,
      isExternal,
      selfDeclaredNote.trim() || 'Em đã tự giác hoàn thành đầy đủ bài học.'
    );

    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    setSubmittedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-xl shrink-0">
              {task.subject === 'Toán' ? '📐' : task.subject === 'Tiếng Việt' ? '✍️' : task.subject === 'Khoa học' ? '🔬' : '📚'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  {task.subject}
                </span>
                <span className="text-blue-100 text-xs font-semibold">{task.week || 'Tuần này'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                {task.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Success Banner if just submitted */}
          {submittedSuccess ? (
            <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center text-3xl shadow-xs">
                🎉
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  Chúc Mừng Em Đã Nộp Bài Thành Công!
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  {isExternal
                    ? 'Hệ thống đã ghi nhận em tự giác hoàn thành bài học. Cô Kim Tiến sẽ sớm xác nhận kết quả cho em nhé!'
                    : 'Bài làm của em đã được gửi tới cô Kim Tiến để nhận xét và cộng Xu rèn luyện. Tự học là niềm vui!'}
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl max-w-md mx-auto text-xs text-blue-900 font-semibold space-y-1 text-left">
                <div className="flex items-center space-x-1.5 font-black text-blue-800">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Giá trị cốt lõi của việc tự học:</span>
                </div>
                <p>
                  "Giá trị quan trọng nhất không chỉ là điểm số, mà là sự trung thực, tính kiên trì, khả năng tự suy nghĩ và sự tiến bộ từng ngày của chính em."
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xs transition-colors"
                >
                  Trở về Góc Học Tập Của Em
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Task Overview Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong>Yêu cầu bài tập:</strong> {task.description}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Hạn nộp: <strong className="text-slate-800">{task.dueDate}</strong></span>
                  <span>·</span>
                  <span>Phần thưởng nỗ lực: <strong className="text-amber-600">+{task.rewardCoins} Xu</strong></span>
                  <span>·</span>
                  <span>
                    Trạng thái hiện tại:{' '}
                    {isAlreadyCompleted ? (
                      <strong className="text-emerald-700">Đã hoàn thành ({existingRecord?.score || 10}đ)</strong>
                    ) : isAlreadySubmitted ? (
                      <strong className="text-amber-700">Đã nộp, chờ cô chấm</strong>
                    ) : existingRecord?.status === 'needs_revision' ? (
                      <strong className="text-orange-700">Cần sửa lại bài</strong>
                    ) : (
                      <strong className="text-slate-700">Chưa nộp</strong>
                    )}
                  </span>
                </div>

                {existingRecord?.note && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold">
                    👩‍🏫 <strong>Lời dặn của cô Kim Tiến:</strong> {existingRecord.note}
                  </div>
                )}
              </div>

              {/* Validation Warning */}
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* CASE A: EXTERNAL LINK ASSIGNMENT */}
              {isExternal && (
                <div className="p-5 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/30 space-y-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      Học Liệu & Bài Luyện Tập Trực Tuyến
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Bài tập này được thiết kế trên nền tảng giáo dục ngoài ({task.externalPlatform || 'Học liệu số trực tuyến'}). Em hãy mở đường dẫn, tự giác học bài và ghi nhận lại nhé.
                    </p>
                  </div>

                  <a
                    href={task.externalUrl || task.attachmentUrl || 'https://hoc10.vn'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>Mở Trang Học Tập Ngoài</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Self-declaration checkbox and reflection note */}
                  <div className="pt-3 border-t border-blue-100 text-left space-y-2 max-w-lg mx-auto">
                    <label className="block text-xs font-bold text-slate-700">
                      Ghi chú tự học của em (Cảm nghĩ hoặc số câu em đã làm):
                    </label>
                    <textarea
                      rows={2}
                      value={selfDeclaredNote}
                      onChange={(e) => setSelfDeclaredNote(e.target.value)}
                      placeholder="Ví dụ: Em đã xem hết video và làm đúng 5/5 bài tập trên trang..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-[11px] text-slate-500 italic">
                      * Lưu ý sư phạm: Trạng thái này là tự khai báo trung thực. Cô Kim Tiến sẽ đối chiếu và xác nhận kết quả cho em.
                    </p>
                  </div>
                </div>
              )}

              {/* CASE B: INTERACTIVE QUESTIONS (Trắc nghiệm, Điền khuyết, Đúng sai, Tự luận ngắn) */}
              {questions.length > 0 && (
                <div className="space-y-6">
                  {/* Question Stepper Indicator if multiple */}
                  {questions.length > 1 && (
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                      {questions.map((q, idx) => {
                        const isAnswered = answers[q.id] !== undefined && String(answers[q.id]).trim() !== '';
                        const isCurrent = activeQuestionIdx === idx;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setActiveQuestionIdx(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1 ${
                              isCurrent
                                ? 'bg-blue-600 text-white shadow-xs'
                                : isAnswered
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Câu {idx + 1}</span>
                            {isAnswered && <Check className="w-3 h-3 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Question Card */}
                  {(() => {
                    const q = questions[activeQuestionIdx] || questions[0];
                    if (!q) return null;
                    const qVal = answers[q.id] || '';
                    const isHintVisible = revealedHints[q.id];

                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                              Câu hỏi {activeQuestionIdx + 1} / {questions.length}
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                              {q.prompt}
                            </h4>
                          </div>

                          {/* Pedagogical Hint Buttons */}
                          <div className="flex items-center space-x-1 shrink-0">
                            {q.hint && (
                              <button
                                type="button"
                                onClick={() => handleToggleHint(q.id)}
                                className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center space-x-1"
                                title="Bấm để xem gợi ý tư duy"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Gợi ý</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAskAIExplanation(q)}
                              disabled={aiExplaining}
                              className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center space-x-1"
                              title="Hỏi cô giáo AI giải thích kiến thức bài này"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              <span>{aiExplaining ? 'Đang soạn...' : 'Hỏi AI'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Hint box if revealed */}
                        {isHintVisible && q.hint && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium animate-in fade-in">
                            💡 <strong>Gợi ý từ cô Kim Tiến:</strong> {q.hint}
                          </div>
                        )}

                        {/* AI Explanation Box */}
                        {aiExplanationText && (
                          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950 font-medium space-y-1 animate-in fade-in">
                            <div className="flex items-center space-x-1.5 font-bold text-purple-800">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span>Cô giáo AI đồng hành tự học:</span>
                            </div>
                            <div className="whitespace-pre-line leading-relaxed">
                              {aiExplanationText}
                            </div>
                          </div>
                        )}

                        {/* INPUT TYPES */}
                        {/* 1. Single Choice & True/False */}
                        {(q.type === 'single_choice' || q.type === 'true_false') && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = qVal === opt;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectOption(q.id, opt)}
                                  className={`p-3.5 text-left rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-100/60'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <span
                                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 2. Fill in the blank */}
                        {q.type === 'fill_in' && (
                          <div className="pt-2 space-y-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Câu trả lời của em:
                            </label>
                            <input
                              type="text"
                              value={qVal}
                              onChange={(e) => handleFillInChange(q.id, e.target.value)}
                              placeholder="Nhập đáp án của em vào đây..."
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        )}

                        {/* 3. Short Essay */}
                        {q.type === 'short_essay' && (
                          <div className="pt-2 space-y-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Đoạn văn ngắn / Suy nghĩ của em:
                            </label>
                            <textarea
                              rows={4}
                              value={qVal}
                              onChange={(e) => handleFillInChange(q.id, e.target.value)}
                              placeholder="Viết câu trả lời tự luận ngắn của em vào đây..."
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <p className="text-[11px] text-slate-500">
                              * Em hãy tự do diễn đạt suy nghĩ chân thành. Cô Kim Tiến sẽ đọc và nhận xét chi tiết bài của em.
                            </p>
                          </div>
                        )}

                        {/* Next / Previous Question Navigation Controls */}
                        {questions.length > 1 && (
                          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                            <button
                              type="button"
                              onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                              disabled={activeQuestionIdx === 0}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            >
                              ← Câu trước
                            </button>

                            <span className="text-slate-400 font-bold">
                              Câu {activeQuestionIdx + 1} / {questions.length}
                            </span>

                            <button
                              type="button"
                              onClick={() => setActiveQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                              disabled={activeQuestionIdx === questions.length - 1}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            >
                              Câu tiếp theo →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Đóng & Lưu tiến trình
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isAlreadyCompleted
                        ? 'Làm Lại & Nộp Bài Mới'
                        : isExternal
                        ? 'Xác Nhận Đã Hoàn Thành'
                        : 'Kiểm Tra & Nộp Bài Cho Cô'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
