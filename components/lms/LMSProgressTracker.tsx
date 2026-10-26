import React, { useState, useMemo } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { Student, ClassTask, TaskStudentStatus } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Check,
  Edit2,
  X,
  ChevronRight,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  Save,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface LMSProgressTrackerProps {
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  initialFilterStatus?: string;
  initialStudentId?: string;
  initialTaskId?: string;
}

export const LMSProgressTracker: React.FC<LMSProgressTrackerProps> = ({
  selectedWeek,
  setSelectedWeek,
  initialFilterStatus = 'all',
  initialStudentId,
  initialTaskId,
}) => {
  const { students, classTasks, updateStudentTaskStatus } = useClassroom();

  // Dual View Mode: 'week_matrix' vs 'student_history'
  const [viewMode, setViewMode] = useState<'week_matrix' | 'student_history'>('week_matrix');

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id || '')
  );

  // Quick Grading Popup
  const [gradingModal, setGradingModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
    studentId: string;
    studentName: string;
    currentStatus: TaskStudentStatus;
    currentScore?: number;
    currentNote?: string;
  } | null>(null);

  const [inputScore, setInputScore] = useState<number | ''>(10);
  const [inputStatus, setInputStatus] = useState<TaskStudentStatus>('completed');
  const [inputNote, setInputNote] = useState('');

  // Available subjects
  const subjects = [
    { id: 'all', label: 'Tất cả môn học' },
    { id: 'Toán', label: 'Toán' },
    { id: 'Tiếng Việt', label: 'Tiếng Việt' },
    { id: 'Khoa học', label: 'Khoa học' },
    { id: 'Lịch sử và Địa lí', label: 'Lịch sử & Địa lí' },
    { id: 'Tin học', label: 'Tin học' },
    { id: 'Tiếng Anh', label: 'Tiếng Anh' },
    { id: 'Hoạt động trải nghiệm', label: 'HĐ Trải nghiệm' },
  ];

  // Tasks filtered by week and subject
  const currentTasks = useMemo(() => {
    return classTasks.filter((t) => {
      const matchWeek =
        selectedWeek === 'Tất cả các tuần' ||
        (t.week && t.week.toLowerCase() === selectedWeek.toLowerCase()) ||
        (!t.week && selectedWeek === 'Tuần 24');
      const matchSub =
        selectedSubject === 'all' ||
        t.subject.toLowerCase() === selectedSubject.toLowerCase();
      return matchWeek && matchSub;
    });
  }, [classTasks, selectedWeek, selectedSubject]);

  // Open grading modal
  const handleOpenGrading = (task: ClassTask, student: Student) => {
    const rec = task.studentRecords[student.id] || { status: 'not_started' };
    setInputStatus(rec.status);
    setInputScore(rec.score !== undefined ? rec.score : 10);
    setInputNote(rec.note || '');
    setGradingModal({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.title,
      studentId: student.id,
      studentName: student.name,
      currentStatus: rec.status,
      currentScore: rec.score,
      currentNote: rec.note,
    });
    soundEffects.playClick();
  };

  // Submit grading modal
  const handleSaveGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModal) return;

    const numScore = inputScore !== '' ? Number(inputScore) : undefined;
    updateStudentTaskStatus(
      gradingModal.taskId,
      gradingModal.studentId,
      inputStatus,
      inputNote.trim() || undefined,
      numScore
    );

    if (inputStatus === 'completed') {
      soundEffects.playCorrect();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } else {
      soundEffects.playCoin();
    }

    setGradingModal(null);
  };

  // Status Badge Component
  const renderStatusBadge = (status: TaskStudentStatus, isOverdue: boolean, score?: number) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Hoàn thành {score !== undefined ? `(${score}đ)` : ''}</span>
        </span>
      );
    }
    if (status === 'submitted') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Chờ chấm</span>
        </span>
      );
    }
    if (status === 'needs_revision') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-orange-100 text-orange-800 border border-orange-200">
          <RotateCcw className="w-3 h-3 text-orange-600" />
          <span>Cần sửa</span>
        </span>
      );
    }
    if (status === 'late' || isOverdue) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>{status === 'late' ? 'Nộp trễ' : 'Quá hạn'}</span>
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <span>Đang làm</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-500">
        <span>Chưa nộp</span>
      </span>
    );
  };

  // Student history view data
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const studentAllTasks = useMemo(() => {
    if (!selectedStudent) return [];
    const todayStr = new Date().toISOString().split('T')[0];

    return classTasks
      .filter((t) => {
        return (
          t.assignedToType === 'all' ||
          (t.assignedToType === 'group' && selectedStudent.group === t.assignedGroup) ||
          (t.assignedToType === 'custom' && t.assignedStudentIds?.includes(selectedStudent.id))
        );
      })
      .map((t) => {
        const rec = t.studentRecords[selectedStudent.id] || { status: 'not_started' };
        const isOverdue =
          rec.status !== 'completed' &&
          rec.status !== 'submitted' &&
          (rec.status === 'late' || Boolean(t.dueDate && t.dueDate < todayStr));
        return {
          ...t,
          record: rec,
          isOverdue,
        };
      });
  }, [classTasks, selectedStudent]);

  const studentProgress = useMemo(() => {
    if (studentAllTasks.length === 0) return { percent: 100, completed: 0, total: 0 };
    const completed = studentAllTasks.filter((t) => t.record.status === 'completed').length;
    return {
      percent: Math.round((completed / studentAllTasks.length) * 100),
      completed,
      total: studentAllTasks.length,
    };
  }, [studentAllTasks]);

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-md">
              THEO DÕI TIẾN ĐỘ HỌC TẬP
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-semibold">
              Trợ lý chủ nhiệm Lớp 5B.2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Kiểm Tra Bài Tập & Đánh Giá Học Sinh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Xem theo tuần hoặc theo từng học sinh; cập nhật điểm số, trạng thái và lời phê trực tiếp.
          </p>
        </div>

        {/* Dual View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setViewMode('week_matrix');
              soundEffects.playClick();
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'week_matrix'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Xem Theo Tuần</span>
          </button>
          <button
            onClick={() => {
              setViewMode('student_history');
              soundEffects.playClick();
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'student_history'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Xem Theo Học Sinh</span>
          </button>
        </div>
      </div>

      {/* VIEW A: WEEK MATRIX (ALL TASKS OF THE WEEK) */}
      {viewMode === 'week_matrix' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Week */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="Tuần 24">Tuần 24</option>
                  <option value="Tuần 23">Tuần 23</option>
                  <option value="Tuần 22">Tuần 22</option>
                  <option value="Tất cả các tuần">Tất cả các tuần</option>
                </select>
              </div>

              {/* Subject */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-hidden"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên học sinh..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
              <span>Bấm vào ô trạng thái để chấm điểm hoặc đổi trạng thái.</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[180px]">Họ và Tên Học Sinh</th>
                    <th className="py-3 px-3 text-center">Tổ</th>
                    {currentTasks.map((t) => (
                      <th
                        key={t.id}
                        className="py-3 px-3 min-w-[170px] text-center"
                        title={t.title}
                      >
                        <div className="text-[10px] text-blue-600 font-black">{t.subject}</div>
                        <div className="text-xs font-bold truncate max-w-[160px] text-slate-800">
                          {t.title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students
                    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
                    .map((student, idx) => {
                      const todayStr = new Date().toISOString().split('T')[0];

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-7 h-7 rounded-lg border border-slate-200 bg-white object-cover"
                            />
                            <span>{student.name}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-500">
                            {student.group || 'Tổ 1'}
                          </td>

                          {currentTasks.map((task) => {
                            const isApplicable =
                              task.assignedToType === 'all' ||
                              (task.assignedToType === 'group' && student.group === task.assignedGroup) ||
                              (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(student.id));

                            if (!isApplicable) {
                              return (
                                <td
                                  key={`${student.id}-${task.id}`}
                                  className="py-2 px-3 text-center bg-slate-50/60"
                                >
                                  <span className="text-[10px] text-slate-400 font-semibold italic">Không giao</span>
                                </td>
                              );
                            }

                            const rec = task.studentRecords[student.id] || { status: 'not_started' };
                            const isOverdue =
                              rec.status !== 'completed' &&
                              rec.status !== 'submitted' &&
                              (rec.status === 'late' || Boolean(task.dueDate && task.dueDate < todayStr));

                            return (
                              <td
                                key={`${student.id}-${task.id}`}
                                onClick={() => handleOpenGrading(task, student)}
                                className="py-2 px-3 text-center cursor-pointer hover:bg-blue-50/50 transition-colors"
                              >
                                {renderStatusBadge(rec.status, isOverdue, rec.score)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: STUDENT-BASED HISTORY */}
      {viewMode === 'student_history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: 42 Students List Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col max-h-[680px]">
            <div className="pb-3 border-b border-slate-100 space-y-2">
              <h3 className="font-black text-sm text-slate-900">
                Chọn Học Sinh (42 Em)
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="overflow-y-auto space-y-1 mt-2 flex-1 pr-1">
              {students
                .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
                .map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStudentId(st.id);
                      soundEffects.playClick();
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all ${
                      selectedStudent?.id === st.id
                        ? 'bg-blue-600 text-white font-black shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className={`text-xs ${selectedStudent?.id === st.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {idx + 1}
                      </span>
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white object-cover shrink-0"
                      />
                      <span className="text-xs truncate">{st.name}</span>
                    </div>

                    <span className={`text-[11px] px-2 py-0.5 rounded-md shrink-0 ${
                      selectedStudent?.id === st.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      🪙 {st.coins}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Right: Selected Student Detail and Tasks History (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
            {selectedStudent && (
              <>
                {/* Student Hero Header */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      className="w-13 h-13 rounded-2xl border-2 border-white shadow-xs object-cover bg-white"
                    />
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                        <span>{selectedStudent.name}</span>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md">
                          {selectedStudent.studentCode || 'HS5B2'}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedStudent.group || 'Tổ 1'} • GVCN: Cô Kim Tiến • PIN: {selectedStudent.parentPin || '1234'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-bold">Tiến độ chung</div>
                      <div className="text-lg font-black text-emerald-700">
                        {studentProgress.percent}% ({studentProgress.completed}/{studentProgress.total})
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Tasks for this student */}
                <div className="space-y-3">
                  <h3 className="font-black text-sm text-slate-900">
                    Lịch Sử Hoàn Thành Các Bài Tập Qua Các Tuần
                  </h3>

                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {studentAllTasks.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenGrading(item, selectedStudent)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-50 text-blue-700 text-[11px] font-black px-2 py-0.5 rounded-md">
                              {item.subject}
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-slate-500 text-xs font-bold">
                              {item.week || 'Tuần 24'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.title}
                          </h4>
                          <div className="text-xs text-slate-500">
                            Ngày giao: {item.assignedDate} • Hạn nộp: <strong className="text-slate-700">{item.dueDate}</strong>
                          </div>
                          {item.record.note && (
                            <p className="text-[11px] text-amber-800 italic mt-0.5">
                              Lời phê: &ldquo;{item.record.note}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {renderStatusBadge(item.record.status, item.isOverdue, item.record.score)}
                          <span className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                            Chấm bài
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* QUICK GRADING & STATUS UPDATE MODAL */}
      {gradingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                  CHẤM BÀI & CẬP NHẬT TRẠNG THÁI
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {gradingModal.studentName}
                </h3>
              </div>
              <button
                onClick={() => setGradingModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrading} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-500 text-xs mb-1">Bài tập</label>
                <div className="font-bold text-slate-900 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {gradingModal.taskTitle}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái bài nộp</label>
                <select
                  value={inputStatus}
                  onChange={(e) => setInputStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="completed">Đã hoàn thành (Chấm đạt)</option>
                  <option value="submitted">Đã nộp, chờ giáo viên kiểm tra</option>
                  <option value="needs_revision">Cần chỉnh sửa hoặc làm lại</option>
                  <option value="late">Nộp trễ (Quá hạn)</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="not_started">Chưa làm / Chưa nộp</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Điểm số (Thang điểm 10)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={inputScore}
                  onChange={(e) => setInputScore(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhận xét của cô Kim Tiến
                </label>
                <textarea
                  rows={2}
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="Ví dụ: Con làm bài cẩn thận, chữ đẹp, đạt điểm 10!"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Kết Quả</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
