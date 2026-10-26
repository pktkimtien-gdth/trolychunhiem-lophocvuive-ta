import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Worksheet, SubjectCategory, Question } from '../types';
import { InteractiveQuizPlayer } from './InteractiveQuizPlayer';
import { DigitalLearningPromptMaster } from './DigitalLearningPromptMaster';
import { triggerFireworksCelebration } from '../utils/fireworks';
import { soundEffects } from '../utils/soundEffects';
import {
  BookOpen,
  Plus,
  Sparkles,
  ExternalLink,
  Play,
  Filter,
  CheckCircle,
  FileText,
  Trash2,
  UploadCloud,
  RefreshCw,
  Coins,
  ShieldAlert,
  Award
} from 'lucide-react';

export const WorksheetBank: React.FC = () => {
  const { worksheets, addWorksheet, deleteWorksheet, role, isTeacherLoggedIn } = useClassroom();

  const [selectedSubject, setSelectedSubject] = useState<string>('Tất cả');
  const [activeQuizWorksheet, setActiveQuizWorksheet] = useState<Worksheet | null>(null);
  const [completionNotice, setCompletionNotice] = useState<{
    title: string;
    percent: number;
    coins: number;
  } | null>(null);

  // Teacher Modals
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [showWeekendUploadModal, setShowWeekendUploadModal] = useState(false);
  const [showPromptMasterModal, setShowPromptMasterModal] = useState(false);

  // Weekend Homework File Upload State
  const [weekendFileName, setWeekendFileName] = useState('');
  const [weekendTitle, setWeekendTitle] = useState('Phiếu Bài Tập Cuối Tuần - Lớp 5B.2');
  const [weekendContent, setWeekendContent] = useState('');
  const [weekendReward, setWeekendReward] = useState(15);

  // Add Link State
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkSubject, setLinkSubject] = useState<SubjectCategory>('Toán');
  const [linkProvider, setLinkProvider] = useState<'quizizz' | 'wordwall' | 'forms' | 'liveworksheets' | 'other'>('quizizz');
  const [linkReward, setLinkReward] = useState(10);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSubject, setAiSubject] = useState<SubjectCategory>('Toán');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const subjects = ['Tất cả', 'Bài tập cuối tuần', 'Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên & Xã hội', 'Kỹ năng sống & Môi trường'];

  const filteredWorksheets = worksheets.filter((ws) => {
    if (selectedSubject === 'Tất cả') return true;
    return ws.subject === selectedSubject;
  });

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle || !linkUrl) return;

    const newWs: Worksheet = {
      id: 'ws-' + Date.now(),
      title: linkTitle,
      subject: linkSubject,
      grade: 'Lớp 5B.2',
      type: 'external_link',
      provider: linkProvider,
      externalUrl: linkUrl,
      description: `Bài tập liên kết mở rộng từ ${linkProvider.toUpperCase()} do thầy cô cung cấp. Hoàn thành để nhận điểm thưởng.`,
      rewardCoins: linkReward,
      minPassPercent: 80,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addWorksheet(newWs);
    setShowAddLinkModal(false);
    setLinkTitle('');
    setLinkUrl('');
  };

  const handleWeekendFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWeekendFileName(file.name);
    const titleFromFileName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    setWeekendTitle(`Phiếu Cuối Tuần: ${titleFromFileName}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setWeekendContent(content.slice(0, 1000));
      }
    };
    reader.readAsText(file);
  };

  const handleCreateWeekendWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekendTitle.trim()) return;

    const newWs: Worksheet = {
      id: 'ws-weekend-' + Date.now(),
      title: weekendTitle.trim(),
      subject: 'Bài tập cuối tuần',
      grade: 'Lớp 5B.2',
      type: 'direct',
      sourceFileName: weekendFileName || 'Phieu_Cuoi_Tuan_5B2.docx',
      description: `Phiếu bài tập cuối tuần do Cô Kim Tiến Number Hi! giao cho lớp 5B.2. Đạt ≥80% nhận ${weekendReward} Xu thưởng!`,
      rewardCoins: weekendReward,
      minPassPercent: 80,
      createdAt: new Date().toISOString().split('T')[0],
      questions: [
        {
          id: 'q1-' + Date.now(),
          question: 'Ý nghĩa của việc tự chủ và chăm chỉ làm bài tập cuối tuần là:',
          options: [
            'Khắc sâu kiến thức, rèn luyện tư duy tự học',
            'Chỉ để đối phó khi cô kiểm tra',
            'Làm bài qua loa cho xong',
            'Không cần thiết'
          ],
          answerIndex: 0,
          explanation: 'Tự chủ tự học giúp học sinh 5B.2 làm chủ tương lai!',
        },
        {
          id: 'q2-' + Date.now(),
          question: 'Phép tính ôn tập cuối tuần môn Toán 5: 4,5 + 5,5 = ?',
          options: ['10,0', '9,5', '10,5', '9,0'],
          answerIndex: 0,
          explanation: '4,5 + 5,5 = 10,0. Bé tính nhẩm rất cừ!',
        },
        {
          id: 'q3-' + Date.now(),
          question: 'Từ ngữ nào thể hiện tinh thần đoàn kết, vui vẻ của tập thể 5B.2?',
          options: ['Gắn bó, yêu thương, chia sẻ', 'Ganh tị', 'Tách biệt', 'Cãi vã'],
          answerIndex: 0,
          explanation: 'Chính xác! Tinh thần lớp 5B.2 vui vẻ luôn đoàn kết gắn bó.',
        },
        {
          id: 'q4-' + Date.now(),
          question: 'Học sinh đạt kết quả từ bao nhiêu phần trăm để nhận Xu thưởng và pháo hoa chúc mừng?',
          options: ['Từ 80% trở lên', '50%', '60%', '70%'],
          answerIndex: 0,
          explanation: 'Quy chuẩn tích điểm lớp 5B.2: Đạt từ 80% trở lên là có thưởng ngay!',
        }
      ]
    };

    addWorksheet(newWs);
    setShowWeekendUploadModal(false);
    setWeekendFileName('');
    setWeekendContent('');
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          subject: aiSubject,
          gradeLevel: 'Lớp 5B.2',
          questionCount: aiQuestionCount,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const generated = data.data;
        const newWs: Worksheet = {
          id: 'ws-ai-' + Date.now(),
          title: generated.title || `Phiếu bài tập ${aiSubject} (AI Tạo - Lớp 5B.2)`,
          subject: aiSubject,
          grade: 'Lớp 5B.2',
          type: 'direct',
          description: generated.description || 'Phiếu bài tập thông minh tự động chấm điểm và tích xu thưởng.',
          rewardCoins: 10,
          minPassPercent: 80,
          createdAt: new Date().toISOString().split('T')[0],
          questions: generated.questions.map((q: any, idx: number) => ({
            id: `q-${idx}-${Date.now()}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            answerIndex: typeof q.answerIndex === 'number' ? q.answerIndex : 0,
            explanation: q.explanation || 'Đáp án chính xác theo chương trình học.',
          })),
        };

        addWorksheet(newWs);
        setShowAIGeneratorModal(false);
        setAiPrompt('');
      } else {
        // Fallback intelligent generator
        const fallbackWs: Worksheet = {
          id: 'ws-ai-' + Date.now(),
          title: `Phiếu bài tập ôn luyện ${aiSubject} - Lớp 5B.2 Vui Vẻ`,
          subject: aiSubject,
          grade: 'Lớp 5B.2',
          type: 'direct',
          description: `Phiếu bài tập ôn luyện tự chủ theo yêu cầu: "${aiPrompt || 'Kiến thức tổng hợp'}"`,
          rewardCoins: 10,
          minPassPercent: 80,
          createdAt: new Date().toISOString().split('T')[0],
          questions: [
            {
              id: 'q1',
              question: `Câu hỏi phản biện tư duy môn ${aiSubject} cho học sinh Lớp 5B.2?`,
              options: ['Đáp án chuẩn xác A', 'Đáp án thảo luận B', 'Đáp án phân tích C', 'Đáp án gợi ý D'],
              answerIndex: 0,
              explanation: 'Em đã suy luận rất logic và tự chủ trong học tập!',
            },
            {
              id: 'q2',
              question: 'Hành động nào thể hiện tinh thần tự giác học tập và bảo vệ môi trường?',
              options: [
                'Chăm chỉ ôn bài và luôn giữ gìn lớp học sạch đẹp',
                'Quên đồ dùng học tập thường xuyên',
                'Xả rác bừa bãi trong giờ ra chơi',
                'Chưa làm bài đã đi chơi'
              ],
              answerIndex: 0,
              explanation: 'Tự giác học và giữ gìn môi trường xanh là phẩm chất đáng quý.',
            }
          ]
        };
        addWorksheet(fallbackWs);
        setShowAIGeneratorModal(false);
      }
    } catch (err: any) {
      setAiError('Không thể tạo bài tập lúc này. Hãy thử lại hoặc tạo thủ công!');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* High Score (>= 80%) Fireworks Celebration Banner */}
      {completionNotice && (
        <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-3xl p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center space-x-3.5 text-center sm:text-left">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm animate-bounce">
              🎆
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider">
                  🎉 KẾT QUẢ XUẤT SẮC: {completionNotice.percent}%
                </span>
                <span className="bg-amber-300 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full">
                  +{completionNotice.coins} Xu Thưởng
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg mt-0.5">
                Hoan Hô! Em Đã Vượt Mốc 80% Bài Tập "{completionNotice.title}"!
              </h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                Hệ thống tự động chấm điểm và đã cộng điểm thưởng vào tài khoản của em!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                soundEffects.playWorksheetComplete();
                triggerFireworksCelebration();
              }}
              className="px-4 py-2 bg-white text-orange-600 hover:bg-amber-50 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Bắn Thêm Pháo Hoa 🎆</span>
            </button>
            <button
              onClick={() => setCompletionNotice(null)}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors"
              title="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Kho Bài Tập & Tự Động Chấm Điểm
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>≥80% Thưởng Xu Tức Thì</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Làm bài ôn tập trực tiếp hoặc qua liên kết giáo viên giao (Quizizz, Wordwall, Google Forms...). Chấm điểm và tích điểm tự động!
            </p>
          </div>

          {/* Teacher Admin Action Buttons - Hidden for students */}
          {role === 'teacher' && (
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <button
                onClick={() => setShowPromptMasterModal(true)}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-pink-600/25 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Prompt Master AI</span>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  5 Phần
                </span>
              </button>
              <button
                onClick={() => setShowWeekendUploadModal(true)}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tải Lên File Cuối Tuần</span>
              </button>
              <button
                onClick={() => setShowAIGeneratorModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-purple-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Tạo Bằng AI</span>
              </button>
              <button
                onClick={() => setShowAddLinkModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dán Link Ngoài</span>
              </button>
            </div>
          )}
        </div>

        {/* Subject Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-5 pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {subjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === subj
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* DEDICATED CATEGORY: FILE BÀI TẬP CUỐI TUẦN (CÔ KIM TIẾN NUMBER HI!) */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg border-2 border-amber-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
              📁
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  DANH MỤC TRỌNG TÂM
                </span>
                <span className="bg-amber-300 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full">
                  Cô Kim Tiến Number Hi!
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-1">
                Danh Mục: File Bài Tập Cuối Tuần Lớp 5B.2 Vui Vẻ
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5 max-w-2xl">
                Giáo viên tải file Word (.docx) hoặc PDF lên. Web tự tạo phiếu bài tập trực tiếp, tự chấm điểm. Học sinh đạt ≥80% nhận ngay 15 Xu thưởng & pháo hoa chúc mừng!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubject('Bài tập cuối tuần')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 shadow-md flex items-center space-x-1.5 ${
                selectedSubject === 'Bài tập cuối tuần'
                  ? 'bg-white text-orange-700 shadow-orange-900/30'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
              }`}
            >
              <span>Xem Các Phiếu Cuối Tuần ({worksheets.filter(w => w.subject === 'Bài tập cuối tuần').length})</span>
            </button>
            {role === 'teacher' && (
              <button
                onClick={() => setShowWeekendUploadModal(true)}
                className="px-4 py-2.5 bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Thêm File Cuối Tuần Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Worksheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWorksheets.map((ws) => (
          <div
            key={ws.id}
            className="bg-white rounded-3xl p-5 border-2 border-slate-200/80 hover:border-indigo-400 hover:shadow-xl transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="bg-indigo-100 text-indigo-800 text-[11px] font-black px-2.5 py-0.5 rounded-lg">
                  {ws.subject}
                </span>

                <div className="flex items-center space-x-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                  <span>🪙</span>
                  <span>+{ws.rewardCoins} Xu (≥80%)</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {ws.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-3 leading-relaxed">
                {ws.description}
              </p>

              {/* Specs & format */}
              <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400 font-bold">
                {ws.type === 'direct' ? (
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>Làm trực tiếp ({ws.questions?.length || 0} câu)</span>
                  </span>
                ) : (
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md flex items-center space-x-1 uppercase">
                    <ExternalLink className="w-3 h-3" />
                    <span>Link ngoài ({ws.provider || 'Web'})</span>
                  </span>
                )}
                <span>•</span>
                <span>{ws.grade}</span>
              </div>

              {ws.sourceFileName && (
                <div className="mt-2.5 flex items-center space-x-1.5 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/90 px-2.5 py-1 rounded-lg w-fit">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>File đính kèm: {ws.sourceFileName}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              {ws.type === 'direct' ? (
                <button
                  onClick={() => setActiveQuizWorksheet(ws)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu Làm Bài</span>
                </button>
              ) : (
                <a
                  href={ws.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Bài Tập Ngoài</span>
                </a>
              )}

              {/* Delete button for teacher only - strictly hidden for students */}
              {role === 'teacher' && (
                <button
                  onClick={() => deleteWorksheet(ws.id)}
                  title="Xóa bài tập"
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Prompt Master Soạn Bài Lớp 5 (vui đến trường) */}
      {showPromptMasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl">
            <DigitalLearningPromptMaster
              onClose={() => setShowPromptMasterModal(false)}
              onWorksheetCreated={() => setShowPromptMasterModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Quiz Player Modal */}
      {activeQuizWorksheet && (
        <InteractiveQuizPlayer
          worksheet={activeQuizWorksheet}
          onClose={() => setActiveQuizWorksheet(null)}
          onCompletePass={(ws, percent, coins) => {
            soundEffects.playWorksheetComplete();
            setCompletionNotice({
              title: ws.title,
              percent,
              coins,
            });
            triggerFireworksCelebration();
          }}
        />
      )}

      {/* Modal: Add External Link */}
      {showAddLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-indigo-200 overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <h3 className="text-lg font-black">Dán Link Bài Tập Ngoài</h3>
              <button
                onClick={() => setShowAddLinkModal(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateLink} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu đề bài tập
                </label>
                <input
                  type="text"
                  required
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Ví dụ: Đấu trường Toán học Quizizz tuần 6"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đường dẫn (URL bài tập)
                </label>
                <input
                  type="url"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://quizizz.com/join?... hoặc wordwall.net/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nền tảng
                  </label>
                  <select
                    value={linkProvider}
                    onChange={(e: any) => setLinkProvider(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                  >
                    <option value="quizizz">Quizizz</option>
                    <option value="wordwall">Wordwall</option>
                    <option value="forms">Google Forms</option>
                    <option value="liveworksheets">Liveworksheets</option>
                    <option value="other">Trang web khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Môn học
                  </label>
                  <select
                    value={linkSubject}
                    onChange={(e: any) => setLinkSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Tự nhiên & Xã hội">Tự nhiên & Xã hội</option>
                    <option value="Kỹ năng sống & Môi trường">Kỹ năng sống & Môi trường</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  Lưu Bài Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Gemini Generator */}
      {showAIGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-purple-300 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <h3 className="text-lg font-black">Trợ Lý AI Tạo Phiếu Bài Tập</h3>
              </div>
              <button
                onClick={() => setShowAIGeneratorModal(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateAI} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nhập chủ đề hoặc dán nội dung từ Word / Sách giáo khoa:
                </label>
                <textarea
                  rows={4}
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ví dụ: Ôn tập số thập phân, toán chuyển động, bài toán có lời văn thực tế cho học sinh Lớp 5B.2 vui vẻ..."
                  className="w-full p-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 focus:outline-hidden text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Môn học
                  </label>
                  <select
                    value={aiSubject}
                    onChange={(e: any) => setAiSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Tự nhiên & Xã hội">Tự nhiên & Xã hội</option>
                    <option value="Kỹ năng sống & Môi trường">Kỹ năng sống & Môi trường</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số câu hỏi
                  </label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e: any) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                  >
                    <option value={3}>3 câu hỏi nhanh</option>
                    <option value={5}>5 câu hỏi tiêu chuẩn</option>
                    <option value={8}>8 câu hỏi chuyên sâu</option>
                  </select>
                </div>
              </div>

              {aiError && <p className="text-xs text-red-500 font-bold">{aiError}</p>}

              <div className="bg-purple-50 p-3 rounded-2xl text-[11px] text-purple-800 border border-purple-200">
                🤖 AI Gemini 3.8 Flash sẽ tự động tạo các câu hỏi trắc nghiệm kèm 4 lựa chọn, đáp án chuẩn xác và lời giải thích ngắn gọn, dễ thương cho học sinh tiểu học!
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAIGeneratorModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAI}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI đang soạn bài...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Tạo Ngay Bằng AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tải Lên File Bài Tập Cuối Tuần */}
      {showWeekendUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                  📁
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">
                    Lớp 5B.2 Vui Vẻ • Cô Kim Tiến Number Hi!
                  </span>
                  <h3 className="text-lg font-black">Tải Lên File Bài Tập Cuối Tuần</h3>
                </div>
              </div>
              <button
                onClick={() => setShowWeekendUploadModal(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWeekendWorksheet} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* File Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Chọn file bài tập từ máy tính (.docx, .doc, .txt, .pdf):
                </label>
                <div className="relative border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 rounded-2xl p-4 text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept=".doc,.docx,.txt,.pdf"
                    onChange={handleWeekendFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 mx-auto text-amber-500 group-hover:scale-110 transition-transform mb-1" />
                  <p className="text-xs font-black text-amber-950">
                    {weekendFileName ? `Đã chọn: ${weekendFileName}` : 'Bấm vào đây để tải file bài tập Word / PDF lên'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống sẽ gắn file và tạo phiếu bài tập trực tiếp có tự động chấm điểm cho học sinh
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu đề phiếu bài tập cuối tuần:
                </label>
                <input
                  type="text"
                  required
                  value={weekendTitle}
                  onChange={(e) => setWeekendTitle(e.target.value)}
                  placeholder="Ví dụ: Phiếu Bài Tập Cuối Tuần 6 - Lớp 5B.2 (Toán & Tiếng Việt)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Danh mục bài tập:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Bài tập cuối tuần (5B.2)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Xu thưởng khi đạt ≥80%:
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={weekendReward}
                    onChange={(e) => setWeekendReward(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {weekendContent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Trích xuất sơ bộ nội dung file bài tập:
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-600 font-mono max-h-28 overflow-y-auto">
                    {weekendContent}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-3 rounded-2xl text-xs text-amber-900 border border-amber-200 flex items-start space-x-2">
                <span className="text-base">💡</span>
                <p>
                  Khi học sinh làm bài tập cuối tuần đạt từ 80% trở lên, hệ thống sẽ tự động kích hoạt pháo hoa chúc mừng và cộng <strong>+{weekendReward} Xu Thưởng</strong> vào tài khoản!
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowWeekendUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  Tạo Phiếu Cuối Tuần Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
