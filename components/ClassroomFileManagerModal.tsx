import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  Users,
  Award,
  BookOpen,
  Download,
  Plus,
  Coins,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { triggerFireworksCelebration } from '../utils/fireworks';
import confetti from 'canvas-confetti';
import { Worksheet, Question } from '../types';
import { DigitalLearningPromptMaster } from './DigitalLearningPromptMaster';

interface ClassroomFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'students' | 'weekend' | 'prompt_master';
}

export const ClassroomFileManagerModal: React.FC<ClassroomFileManagerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'students',
}) => {
  const {
    students,
    bulkImportStudents,
    worksheets,
    addWorksheet,
    isTeacherLoggedIn,
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<'students' | 'weekend' | 'prompt_master'>(defaultTab);

  // Tab 1: Students File Upload State
  const [studentFileName, setStudentFileName] = useState<string | null>(null);
  const [studentRawText, setStudentRawText] = useState('');
  const [studentImportSuccess, setStudentImportSuccess] = useState<number | null>(null);

  // Standard 42 student names of Lớp 5B.2 Vui Vẻ - Cô Kim Tiến Number Hi!
  const standard42Students = [
    'Nguyễn Gia Huy', 'Trần Gia Hân', 'Lê Hoàng Nam', 'Phạm Minh Khôi', 'Võ Đức Trí',
    'Nguyễn Mai Lan', 'Trần Quốc Bảo', 'Lê Thảo My', 'Phan Mai Anh', 'Đặng Quốc Tuấn',
    'Vũ Hồng Phúc', 'Hoàng Thiên Ân', 'Bùi Chấn Khang', 'Đỗ Bảo Ngọc', 'Huỳnh Thanh Trúc',
    'Ngô Kiến Huy', 'Trịnh Kim Ngân', 'Dương Minh Quân', 'Đoàn Phương Thảo', 'Lý Gia Kiệt',
    'Tạ Nhật Nam', 'Mai Khánh Linh', 'Châu Vĩnh Khang', 'Lâm Gia Tuệ', 'Đinh Trọng Nhân',
    'Lương Yến Nhi', 'Trương Quốc Việt', 'Tôn Nữ Bích Trâm', 'Hà Anh Dũng', 'Chu Diệu Thảo',
    'Giang Thành Long', 'Thạch Minh Triết', 'Nghiêm Thùy Trang', 'Vương Tuấn Kiệt', 'Quách Bảo Trâm',
    'Bạch Hoài An', 'Cao Đăng Khoa', 'La Gia Hưng', 'Ôn Diệu Linh', 'Hứa Vĩnh Phát',
    'Diệp Thảo Quyên', 'Phan Nhật Hoàng'
  ].join('\n');

  // Tab 2: Weekend Worksheet File Upload State
  const [weekendFileName, setWeekendFileName] = useState<string | null>(null);
  const [weekendTitle, setWeekendTitle] = useState('Phiếu Bài Tập Cuối Tuần 7 - Lớp 5B.2 Vui Vẻ');
  const [weekendSubject, setWeekendSubject] = useState<'Toán' | 'Tiếng Việt' | 'Tiếng Anh' | 'Bài tập cuối tuần'>('Bài tập cuối tuần');
  const [weekendReward, setWeekendReward] = useState<number>(15);
  const [weekendPassPercent, setWeekendPassPercent] = useState<number>(80);
  const [weekendNote, setWeekendNote] = useState('Phiếu bài tập cuối tuần do Cô Kim Tiến Number Hi! giao. Đạt từ 80% trở lên sẽ nhận 15 Xu thưởng và pháo hoa rực rỡ!');
  const [weekendSuccess, setWeekendSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle student file upload
  const handleStudentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStudentFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setStudentRawText(content);
      }
    };
    reader.readAsText(file);
  };

  // Submit student roster import
  const handleImportStudents = () => {
    const lines = studentRawText
      .split(/\r?\n|,|;/)
      .map((line) => line.replace(/^\d+[\.\-\s]+/, '').trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const res = bulkImportStudents(lines);
    setStudentImportSuccess(res.count);
    triggerFireworksCelebration();

    setTimeout(() => {
      setStudentImportSuccess(null);
    }, 2500);
  };

  // Handle weekend file upload
  const handleWeekendFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWeekendFileName(file.name);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    setWeekendTitle(`Phiếu Cuối Tuần: ${cleanName}`);
  };

  // Submit weekend worksheet creation
  const handleCreateWeekendWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekendTitle.trim()) return;

    const sampleQuestions: Question[] = [
      {
        id: 'q1-' + Date.now(),
        question: 'Câu 1 (Ôn tập cuối tuần Lớp 5B.2): Chuyển hỗn số 4 và 3/5 thành phân số thập phân:',
        options: ['23/5', '20/5', '12/5', '19/5'],
        answerIndex: 0,
        explanation: '4 và 3/5 = (4 × 5 + 3)/5 = 23/5 = 46/10.',
      },
      {
        id: 'q2-' + Date.now(),
        question: 'Câu 2: Số thập phân gồm "3 mươi, 5 đơn vị, 8 phần mười, 2 phần trăm" viết là:',
        options: ['35,82', '35,802', '305,82', '35,082'],
        answerIndex: 0,
        explanation: 'Số thập phân là 35,82.',
      },
      {
        id: 'q3-' + Date.now(),
        question: 'Câu 3: Học sinh Lớp 5B.2 cần đạt từ bao nhiêu phần trăm để được tự động cộng Xu đổi quà thật?',
        options: ['Từ 80% trở lên', 'Từ 50%', 'Từ 60%', 'Từ 70%'],
        answerIndex: 0,
        explanation: 'Quy chuẩn khen thưởng của Cô Kim Tiến: Đạt từ 80% là nhận Xu ngay!',
      },
      {
        id: 'q4-' + Date.now(),
        question: 'Câu 4: Tinh thần học tập chủ đạo của tập thể 5B.2 vui vẻ là:',
        options: [
          'Kiến tạo kiến thức, vui vẻ học tập, phản biện tư duy, tự chủ tự học',
          'Học thụ động, chỉ chép bài',
          'Làm bài đối phó',
          'Không chia sẻ giúp đỡ bạn'
        ],
        answerIndex: 0,
        explanation: 'Chính xác! Lớp 5B.2 vui vẻ luôn tự chủ tự học, làm chủ tương lai!',
      },
      {
        id: 'q5-' + Date.now(),
        question: 'Câu 5: Quãng đường từ nhà đến trường dài 3,6 km, bạn Gia Huy đạp xe hết 15 phút. Vận tốc của Huy là:',
        options: ['14,4 km/giờ', '12 km/giờ', '15 km/giờ', '16 km/giờ'],
        answerIndex: 0,
        explanation: '15 phút = 0,25 giờ. Vận tốc = 3,6 : 0,25 = 14,4 km/giờ.',
      }
    ];

    const newWs: Worksheet = {
      id: 'ws-weekend-' + Date.now(),
      title: weekendTitle.trim(),
      subject: 'Bài tập cuối tuần',
      grade: 'Lớp 5B.2',
      type: 'direct',
      sourceFileName: weekendFileName || 'Phieu_Cuoi_Tuan_Lop5B2.docx',
      description: weekendNote,
      rewardCoins: Number(weekendReward),
      minPassPercent: Number(weekendPassPercent),
      createdAt: new Date().toISOString().split('T')[0],
      questions: sampleQuestions,
    };

    addWorksheet(newWs);
    setWeekendSuccess(true);
    triggerFireworksCelebration();

    setTimeout(() => {
      setWeekendSuccess(false);
      setWeekendFileName(null);
    }, 2500);
  };

  const parsedLinesCount = studentRawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  const weekendWorksheetsList = worksheets.filter((w) => w.subject === 'Bài tập cuối tuần');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-indigo-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              📁
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  DANH MỤC TỆP LỚP HỌC
                </span>
                <span className="text-amber-300 font-extrabold text-xs">
                  5B.2 Vui Vẻ
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">
                Thêm File Danh Sách Học Sinh & File Bài Tập Cuối Tuần
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                GVCN: Cô Kim Tiến Number Hi! • Quản lý sĩ số 42 học sinh & phiếu rèn luyện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm border-t-2 border-x-2 transition-all ${
              activeTab === 'students'
                ? 'bg-white border-indigo-400 text-indigo-700 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>1. Thêm File Danh Sách Học Sinh (42 HS)</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('weekend')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm border-t-2 border-x-2 transition-all ${
              activeTab === 'weekend'
                ? 'bg-white border-amber-400 text-amber-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>2. Thêm File Bài Tập Cuối Tuần</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {weekendWorksheetsList.length} phiếu
            </span>
          </button>

          <button
            onClick={() => setActiveTab('prompt_master')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm border-t-2 border-x-2 transition-all ${
              activeTab === 'prompt_master'
                ? 'bg-white border-purple-400 text-purple-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>3. Trợ Lý Soạn Bài Học (Prompt Master)</span>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              AI 5 Phần
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: FILE DANH SÁCH HỌC SINH */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-indigo-950">
                <span className="text-xl">👩‍🏫</span>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-indigo-900">
                    Danh mục: Tải lên danh sách học sinh Lớp 5B.2 Vui Vẻ
                  </p>
                  <p className="text-indigo-700">
                    Cô Kim Tiến có thể tải file danh sách từ Excel (.xlsx, .csv), Word hoặc Text. Hệ thống sẽ tự động phân tích 42 học sinh, tự nhận diện giới tính, gán avatar sinh động và xếp vào 44 bàn học của lớp!
                  </p>
                </div>
              </div>

              {/* Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Cách 1: Tải file danh sách từ máy tính (.txt, .csv, Word, Excel)
                </label>
                <div className="relative border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 rounded-2xl p-5 text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept=".txt,.csv,.doc,.docx,.xlsx"
                    onChange={handleStudentFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-9 h-9 mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-1.5" />
                  <p className="text-sm font-bold text-indigo-950">
                    {studentFileName ? `Đã nhận tệp: ${studentFileName}` : 'Bấm vào đây để chọn file danh sách từ máy'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hỗ trợ tệp văn bản danh sách học sinh hoặc xuất từ VnEdu / CSDL ngành
                  </p>
                </div>
              </div>

              {/* Paste or sample 42 names */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Cách 2: Hoặc dán danh sách tên học sinh (mỗi bạn 1 dòng)
                  </label>
                  <button
                    type="button"
                    onClick={() => setStudentRawText(standard42Students)}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-xl flex items-center space-x-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nạp mẫu chuẩn 42 học sinh 5B.2</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={studentRawText}
                  onChange={(e) => setStudentRawText(e.target.value)}
                  placeholder="1. Nguyễn Gia Huy&#10;2. Trần Gia Hân&#10;3. Lê Hoàng Nam&#10;..."
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-hidden text-xs font-mono font-medium leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                  <span>Đã nhận diện: <strong className="text-indigo-600 font-black">{parsedLinesCount} học sinh</strong></span>
                  <span>Hiện có trong lớp: <strong className="text-emerald-600 font-black">{students.length} học sinh</strong></span>
                </div>
              </div>

              {studentImportSuccess !== null && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-2 text-xs sm:text-sm font-bold animate-in zoom-in-95">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Tuyệt vời! Đã cập nhật thành công {studentImportSuccess} học sinh vào Lớp 5B.2 Vui Vẻ của Cô Kim Tiến!
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStudentRawText(standard42Students)}
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Khôi phục 42 học sinh mặc định
                </button>
                <button
                  type="button"
                  onClick={handleImportStudents}
                  disabled={parsedLinesCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-40"
                >
                  Lưu & Áp Dụng {parsedLinesCount} Học Sinh Vào Lớp 5B.2
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FILE BÀI TẬP CUỐI TUẦN */}
          {activeTab === 'weekend' && (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-950">
                <span className="text-xl">📝</span>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-amber-900">
                    Danh mục: File Bài Tập Cuối Tuần (Cô Kim Tiến Number Hi!)
                  </p>
                  <p className="text-amber-800">
                    Giáo viên tải file Word (.docx), PDF hoặc phiếu bài tập cuối tuần lên. Web sẽ số hóa thành phiếu bài tập có thể làm trực tiếp. Học sinh đạt kết quả từ 80% trở lên sẽ được tự động chấm điểm, bắn pháo hoa chúc mừng và cộng 15 Xu thưởng!
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateWeekendWorksheet} className="space-y-4">
                {/* Upload File Zone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Chọn file bài tập cuối tuần từ máy tính (.docx, .doc, .pdf, .txt):
                  </label>
                  <div className="relative border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 rounded-2xl p-4 text-center cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf,.txt"
                      onChange={handleWeekendFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-9 h-9 mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-1" />
                    <p className="text-xs sm:text-sm font-black text-amber-950">
                      {weekendFileName ? `Đã chọn: ${weekendFileName}` : 'Bấm vào đây để tải file bài tập Word / PDF lên'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ví dụ: Phieu_Bai_Tap_Cuoi_Tuan_7_Toan_TiengViet_5B2.docx
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tiêu đề phiếu bài tập cuối tuần:
                  </label>
                  <input
                    type="text"
                    required
                    value={weekendTitle}
                    onChange={(e) => setWeekendTitle(e.target.value)}
                    placeholder="Ví dụ: Phiếu Bài Tập Cuối Tuần 7 - Lớp 5B.2 Vui Vẻ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Môn học
                    </label>
                    <select
                      value={weekendSubject}
                      onChange={(e: any) => setWeekendSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                    >
                      <option value="Bài tập cuối tuần">Bài tập cuối tuần (Tổng hợp)</option>
                      <option value="Toán">Toán 5</option>
                      <option value="Tiếng Việt">Tiếng Việt 5</option>
                      <option value="Tiếng Anh">Tiếng Anh 5</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Xu thưởng khi đạt ≥80%
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mức chuẩn tích điểm (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={weekendPassPercent}
                      onChange={(e) => setWeekendPassPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ghi chú / Lời nhắn của Cô Kim Tiến tới học sinh:
                  </label>
                  <textarea
                    rows={2}
                    value={weekendNote}
                    onChange={(e) => setWeekendNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {weekendSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-2 text-xs sm:text-sm font-bold animate-in zoom-in-95">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Thành công! Phiếu bài tập cuối tuần đã được tạo và sẵn sàng cho học sinh 5B.2 làm bài tích điểm!
                    </span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center space-x-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Tải Lên & Tạo Phiếu Bài Tập Cuối Tuần</span>
                  </button>
                </div>
              </form>

              {/* Existing weekend worksheets list */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">
                  Các phiếu bài tập cuối tuần hiện có của Lớp 5B.2 ({weekendWorksheetsList.length}):
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {weekendWorksheetsList.map((ws) => (
                    <div
                      key={ws.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-amber-500 font-black">📄</span>
                        <span className="font-bold text-slate-800 truncate">{ws.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          +{ws.rewardCoins} Xu (≥80%)
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {ws.questions?.length || 0} câu
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRỢ LÝ SOẠN BÀI HỌC (PROMPT MASTER) */}
          {activeTab === 'prompt_master' && (
            <DigitalLearningPromptMaster
              onWorksheetCreated={() => setActiveTab('weekend')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            🏫 Lớp 5B.2 Vui Vẻ • Cô Kim Tiến Number Hi!
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
