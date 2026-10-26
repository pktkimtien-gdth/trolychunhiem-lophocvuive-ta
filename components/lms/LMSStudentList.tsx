import React, { useState, useMemo } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { Student, ClassTask } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Download,
  Plus,
  Edit2,
  Save,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  Zap,
  Coins
} from 'lucide-react';

interface LMSStudentListProps {
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  initialFilterStatus?: string;
  initialSelectedStudentId?: string;
}

export const LMSStudentList: React.FC<LMSStudentListProps> = ({
  selectedWeek,
  setSelectedWeek,
  initialFilterStatus = 'all',
  initialSelectedStudentId,
}) => {
  const { role, currentStudent, students, classTasks, updateStudent, awardCoins, updateStudentTaskStatus } = useClassroom();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortField, setSortField] = useState<'stt' | 'name' | 'progress'>('stt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Bulk Selection: set of selected student IDs
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Pagination: Default 42 for direct scrolling view without multi-page interruptions
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(42);

  // Student Profile Drawer / Modal
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    if (initialSelectedStudentId) {
      return students.find((s) => s.id === initialSelectedStudentId) || null;
    }
    return null;
  });

  const [editNotes, setEditNotes] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editComments, setEditComments] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [bulkFeedbackMsg, setBulkFeedbackMsg] = useState<string | null>(null);

  // Open profile and populate form
  const handleOpenProfile = (student: Student) => {
    soundEffects.playClick();
    setActiveStudent(student);
    setEditNotes(student.notes || '');
    setEditGoals(student.goals || '');
    setEditComments(student.teacherComments || '');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setIsSavingProfile(true);

    const updated = {
      ...activeStudent,
      notes: editNotes,
      goals: editGoals,
      teacherComments: editComments,
    };

    updateStudent(updated);
    setActiveStudent(updated);
    soundEffects.playCorrect();
    setIsSavingProfile(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // Filter tasks by week and subject
  const filteredTasks = useMemo(() => {
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

  // Compute student metrics
  const studentsWithMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return students.map((student, idx) => {
      let applicableCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let missingCount = 0;
      let overdueCount = 0;
      let lastUpdated = 'Mới cập nhật';

      filteredTasks.forEach((task) => {
        const isApp =
          task.assignedToType === 'all' ||
          (task.assignedToType === 'group' && student.group === task.assignedGroup) ||
          (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(student.id));

        if (!isApp) return;
        applicableCount++;

        const rec = task.studentRecords[student.id];
        const status = rec?.status || 'not_started';
        const isOverdue =
          status !== 'completed' &&
          status !== 'submitted' &&
          (status === 'late' || Boolean(task.dueDate && task.dueDate < todayStr));

        if (status === 'completed') {
          completedCount++;
        } else if (status === 'submitted' || status === 'needs_revision') {
          pendingCount++;
        } else {
          missingCount++;
        }

        if (isOverdue) overdueCount++;
        if (rec?.updatedAt) lastUpdated = rec.updatedAt;
      });

      const incompleteCount = applicableCount - completedCount;
      const progressPercent =
        applicableCount > 0 ? Math.round((completedCount / applicableCount) * 100) : 100;

      let overallStatus: 'completed' | 'in_progress' | 'missing' | 'needs_followup' = 'in_progress';
      if (applicableCount > 0 && completedCount === applicableCount) {
        overallStatus = 'completed';
      } else if (overdueCount > 0 || incompleteCount >= 2) {
        overallStatus = 'needs_followup';
      } else if (missingCount > 0) {
        overallStatus = 'missing';
      }

      return {
        ...student,
        stt: idx + 1,
        applicableCount,
        completedCount,
        incompleteCount,
        progressPercent,
        overallStatus,
        overdueCount,
        lastUpdated,
      };
    });
  }, [students, filteredTasks]);

  // Filter students by search, group, status
  const filteredStudents = useMemo(() => {
    return studentsWithMetrics.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        String(s.stt) === searchTerm.trim();

      const matchGroup = selectedGroup === 'all' || s.group === selectedGroup;

      let matchStatus = true;
      if (statusFilter === 'completed') {
        matchStatus = s.overallStatus === 'completed';
      } else if (statusFilter === 'in_progress') {
        matchStatus = s.overallStatus === 'in_progress' || s.overallStatus === 'missing';
      } else if (statusFilter === 'needs_followup') {
        matchStatus = s.overallStatus === 'needs_followup' || s.overdueCount > 0;
      }

      return matchSearch && matchGroup && matchStatus;
    });
  }, [studentsWithMetrics, searchTerm, selectedGroup, statusFilter]);

  // Sort students
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      if (sortField === 'stt') {
        return sortOrder === 'asc' ? a.stt - b.stt : b.stt - a.stt;
      }
      if (sortField === 'name') {
        const lastNameA = a.name.split(' ').pop() || '';
        const lastNameB = b.name.split(' ').pop() || '';
        return sortOrder === 'asc'
          ? lastNameA.localeCompare(lastNameB, 'vi')
          : lastNameB.localeCompare(lastNameA, 'vi');
      }
      if (sortField === 'progress') {
        return sortOrder === 'asc'
          ? a.progressPercent - b.progressPercent
          : b.progressPercent - a.progressPercent;
      }
      return 0;
    });
  }, [filteredStudents, sortField, sortOrder]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    if (pageSize >= sortedStudents.length) return sortedStudents;
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;

  const toggleSort = (field: 'stt' | 'name' | 'progress') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Toggle single student selection
  const handleToggleStudentSelect = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select / Deselect all currently filtered students
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      const allIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds(allIds);
    }
  };

  // Select by Group (Tổ 1, Tổ 2, ...)
  const handleSelectGroup = (grp: string) => {
    const grpStudents = students.filter((s) => s.group === grp);
    setSelectedStudentIds(new Set(grpStudents.map((s) => s.id)));
    soundEffects.playClick();
  };

  // Bulk Award Coins
  const handleBulkAwardCoins = (amount: number) => {
    if (selectedStudentIds.size === 0) return;
    selectedStudentIds.forEach((id) => {
      awardCoins(id, amount);
    });
    soundEffects.playCoin();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setBulkFeedbackMsg(`Đã thưởng +${amount} Xu cho ${selectedStudentIds.size} học sinh được chọn!`);
    setTimeout(() => setBulkFeedbackMsg(null), 3000);
  };

  // Bulk Mark Complete for the first active task of the week
  const handleBulkMarkCompleteActiveTask = () => {
    if (selectedStudentIds.size === 0 || filteredTasks.length === 0) return;
    const task = filteredTasks[0];
    selectedStudentIds.forEach((id) => {
      updateStudentTaskStatus(task.id, id, 'completed', 'Cô Kim Tiến: Chấm đạt 10 điểm (Hoàn thành theo tổ)!', 10);
    });
    soundEffects.playCorrect();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    setBulkFeedbackMsg(`Đã chấm hoàn thành bài "${task.title}" cho ${selectedStudentIds.size} học sinh!`);
    setTimeout(() => setBulkFeedbackMsg(null), 3500);
  };

  // Export Selected Students to UTF-8 CSV
  const handleExportSelectedCSV = () => {
    const targetStudents =
      selectedStudentIds.size > 0
        ? studentsWithMetrics.filter((s) => selectedStudentIds.has(s.id))
        : sortedStudents;

    const headers = [
      'STT',
      'Mã Học Sinh',
      'Họ và Tên',
      'Tổ',
      'Số Bài Hoàn Thành',
      'Số Bài Còn Thiếu',
      'Số Bài Quá Hạn',
      'Tiến Độ (%)',
      'Xu Rèn Luyện',
      'Mã PIN Phụ Huynh',
      'Ghi Chú Của Cô Kim Tiến',
    ];

    const rows = targetStudents.map((s) => [
      s.stt,
      `"${s.studentCode || `HS5B2-${s.stt}`}"`,
      `"${s.name}"`,
      `"${s.group || 'Tổ 1'}"`,
      s.completedCount,
      s.incompleteCount,
      s.overdueCount,
      `${s.progressPercent}%`,
      s.coins,
      `"${s.parentPin || '1234'}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_Sach_Hoc_Sinh_Lop5B2_${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    soundEffects.playCoin();
    setBulkFeedbackMsg(`Đã xuất danh sách ${targetStudents.length} học sinh thành công!`);
    setTimeout(() => setBulkFeedbackMsg(null), 3000);
  };

  // NẾU LÀ TÀI KHOẢN HỌC SINH: Chỉ hiển thị hồ sơ của chính em và thông tin Tổ
  // Tuyệt đối không hiển thị danh sách lớp, điểm số hoặc thông tin cá nhân của các bạn khác
  if (role === 'student') {
    const studentInfo = studentsWithMetrics.find((s) => s.id === currentStudent?.id) || {
      ...currentStudent,
      stt: 1,
      applicableCount: 0,
      completedCount: 0,
      incompleteCount: 0,
      progressPercent: 100,
      overallStatus: 'completed',
      overdueCount: 0,
      lastUpdated: 'Mới cập nhật',
    };

    const studentGroupTasks = filteredTasks.filter(
      (t) =>
        t.assignedToType === 'all' ||
        (t.assignedToType === 'group' && t.assignedGroup === currentStudent?.group) ||
        (t.assignedToType === 'custom' && t.assignedStudentIds?.includes(currentStudent?.id || ''))
    );

    return (
      <div className="space-y-6 font-['Quicksand',sans-serif]">
        {/* Banner Học sinh */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1 border-4 border-blue-300 shadow-xl overflow-hidden shrink-0">
              <img
                src={currentStudent?.avatar}
                alt={currentStudent?.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap gap-y-1">
                <span className="bg-white/20 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Hồ Sơ Của Em • Lớp 5B.2
                </span>
                <span className="text-blue-100 text-xs font-bold">
                  Năm học 2026 - 2027 • GVCN: Cô Kim Tiến
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mt-1.5">{currentStudent?.name}</h2>
              <div className="flex items-center justify-center sm:justify-start space-x-3 mt-4 text-xs font-black flex-wrap gap-y-1">
                <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-full shadow-xs">
                  🪙 {currentStudent?.coins || 0} Xu Thưởng
                </span>
                <span className="bg-white/20 text-white px-3 py-1 rounded-full">
                  ⭐ {currentStudent?.stars || 0} Ngôi Sao
                </span>
                <span className="bg-blue-900/60 text-blue-100 px-3 py-1 rounded-full border border-blue-300/40 font-black">
                  {currentStudent?.group ? `Phân tổ: ${currentStudent.group}` : 'Chưa phân tổ'}
                </span>
                <span className="bg-white/20 text-white px-3 py-1 rounded-full">
                  Mã số: {currentStudent?.studentCode || `HS5B2-${currentStudent?.id}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo quyền riêng tư học sinh */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center space-x-3 text-xs sm:text-sm font-bold text-blue-900">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            Hệ thống chỉ hiển thị hồ sơ và tiến độ cá nhân của em cùng thông tin Tổ ({currentStudent?.group || 'Tổ 1'}). Thông tin riêng của các bạn cùng lớp được bảo mật.
          </span>
        </div>

        {/* Thống kê cá nhân */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Nhiệm vụ đã hoàn thành</div>
              <div className="text-xl font-black text-slate-800">
                {(studentInfo as any).completedCount || 0} bài tập
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl">
              📊
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Tiến độ tuần</div>
              <div className="text-xl font-black text-blue-600">
                {(studentInfo as any).progressPercent || 100}%
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xl">
              👥
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Phân tổ học tập</div>
              <div className="text-xl font-black text-purple-700">
                {currentStudent?.group || 'Tổ 1'}
              </div>
            </div>
          </div>
        </div>

        {/* Nhiệm vụ chung của Tổ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900">
            Nhiệm Vụ & Hoạt Động Của {currentStudent?.group || 'Tổ 1'} ({selectedWeek})
          </h3>
          <div className="space-y-3">
            {studentGroupTasks.map((task) => {
              const myRecord = task.studentRecords[currentStudent?.id || ''];
              const status = myRecord?.status || 'not_started';
              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <span className="font-black text-blue-700">{task.subject}</span> •{' '}
                    <span className="font-bold text-slate-800">{task.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {status === 'completed'
                        ? 'Đã hoàn thành'
                        : status === 'submitted'
                        ? 'Đã nộp bài'
                        : 'Cần làm'}
                    </span>
                  </div>
                </div>
              );
            })}
            {studentGroupTasks.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">
                Không có nhiệm vụ riêng nào trong tuần này cho {currentStudent?.group || 'Tổ 1'}.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Quicksand',sans-serif]">
      {/* Toast Feedback */}
      {bulkFeedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bulkFeedbackMsg}</span>
          </div>
          <button
            onClick={() => setBulkFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Control Card: Week/Subject Filters & Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
              <span className="font-black text-blue-700 uppercase tracking-wider">LỚP 5B.2</span>
              <span>·</span>
              <span>Sĩ số: 42 học sinh</span>
              <span>·</span>
              <span>GVCN: Cô Kim Tiến</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Quản Lý Học Sinh & Theo Dõi Nhiệm Vụ
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Week Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="Tuần 24">Tuần 24</option>
                <option value="Tuần 23">Tuần 23</option>
                <option value="Tuần 22">Tuần 22</option>
                <option value="Tất cả các tuần">Tất cả các tuần</option>
              </select>
            </div>

            {/* Subject Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả môn học</option>
                <option value="Toán">Toán</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Khoa học">Khoa học</option>
                <option value="Lịch sử và Địa lí">Lịch sử & Địa lí</option>
                <option value="Tin học">Tin học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Hoạt động trải nghiệm">HĐ Trải nghiệm</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
              title="Xuất bảng danh sách ra file Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Fast Group / Status Filters */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm tên học sinh, số thứ tự, mã HS..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group (Tổ) Filters */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-bold pb-1 lg:pb-0">
            <span className="text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Tổ:</span>
            {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((grp) => {
              const isAct = selectedGroup === grp;
              const count = grp === 'all' ? 42 : students.filter((s) => s.group === grp).length;
              return (
                <button
                  key={grp}
                  onClick={() => {
                    setSelectedGroup(grp);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    isAct ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {grp === 'all' ? 'Tất cả 4 Tổ' : grp} ({count})
                </button>
              );
            })}
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-bold pb-1 lg:pb-0">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả trạng thái
            </button>
            <button
              onClick={() => {
                setStatusFilter('completed');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Đã hoàn thành 100%
            </button>
            <button
              onClick={() => {
                setStatusFilter('in_progress');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Còn bài chưa xong
            </button>
            <button
              onClick={() => {
                setStatusFilter('needs_followup');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'needs_followup'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Quá hạn / Trễ
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar when 1 or more students are checked */}
      {selectedStudentIds.size > 0 && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3.5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black">
              {selectedStudentIds.size}
            </span>
            <span>Đã chọn {selectedStudentIds.size} / {students.length} học sinh</span>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 text-xs font-bold">
            <button
              onClick={() => handleBulkAwardCoins(5)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl transition-colors flex items-center space-x-1 shadow-xs"
              title="Tặng +5 Xu cho các học sinh đang được chọn"
            >
              <span>⭐ +5 Xu thưởng</span>
            </button>
            <button
              onClick={() => handleBulkAwardCoins(10)}
              className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-amber-950 rounded-xl transition-colors flex items-center space-x-1 shadow-xs"
              title="Tặng +10 Xu cho các học sinh đang được chọn"
            >
              <span>⭐ +10 Xu</span>
            </button>
            {filteredTasks.length > 0 && (
              <button
                onClick={handleBulkMarkCompleteActiveTask}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors flex items-center space-x-1 shadow-xs"
                title="Đánh dấu hoàn thành bài tập tuần này cho học sinh đã chọn"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Duyệt xong bài tập</span>
              </button>
            )}
            <button
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors"
            >
              Xuất CSV
            </button>
            <button
              onClick={() => setSelectedStudentIds(new Set())}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Student Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider select-none">
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    title="Chọn tất cả danh sách đang hiển thị"
                    className="p-1 hover:text-blue-600"
                  >
                    {selectedStudentIds.size > 0 && selectedStudentIds.size === filteredStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => toggleSort('stt')}
                  className="py-3 px-3 w-12 cursor-pointer hover:text-blue-600 text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>STT</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-blue-600 min-w-[200px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Họ và Tên Học Sinh</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-20">Tổ</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Đã Xong</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Chưa Xong</th>
                <th
                  onClick={() => toggleSort('progress')}
                  className="py-3 px-4 cursor-pointer hover:text-blue-600 text-center min-w-[140px]"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Tiến Độ</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right min-w-[140px]">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isChecked = selectedStudentIds.has(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleStudentSelect(student.id)}
                          className="p-1 hover:text-blue-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* STT */}
                      <td className="py-2.5 px-3 font-bold text-slate-400 text-center">
                        {String(student.stt).padStart(2, '0')}
                      </td>

                      {/* Họ và Tên */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div
                              onClick={() => handleOpenProfile(student)}
                              className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors truncate"
                            >
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                              <span>Mã: {student.studentCode || `HS5B2-${student.stt}`}</span>
                              <span>·</span>
                              <span className="text-amber-700 font-bold">🪙 {student.coins} Xu</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tổ */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-xs">
                          {student.group || 'Tổ 1'}
                        </span>
                      </td>

                      {/* Đã xong */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                          {student.completedCount} / {student.applicableCount} bài
                        </span>
                      </td>

                      {/* Chưa xong / Quá hạn */}
                      <td className="py-2.5 px-3 text-center">
                        {student.incompleteCount === 0 ? (
                          <span className="text-slate-400 font-bold text-xs">0</span>
                        ) : student.overdueCount > 0 ? (
                          <span className="text-rose-700 font-black bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-xs">
                            {student.incompleteCount} (Trễ: {student.overdueCount})
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-xs">
                            {student.incompleteCount} bài
                          </span>
                        )}
                      </td>

                      {/* Tiến độ % */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="w-28 mx-auto space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className={
                                student.progressPercent === 100
                                  ? 'text-emerald-700 font-black'
                                  : student.progressPercent >= 50
                                  ? 'text-blue-700'
                                  : 'text-amber-700'
                              }
                            >
                              {student.progressPercent}%
                            </span>
                            {student.progressPercent === 100 && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                student.progressPercent === 100
                                  ? 'bg-emerald-500'
                                  : student.progressPercent >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${student.progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick +5 Coins */}
                          <button
                            onClick={() => {
                              awardCoins(student.id, 5);
                              soundEffects.playCoin();
                              confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
                            }}
                            title="Thưởng nhanh +5 Xu động viên"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            +5 Xu
                          </button>

                          {/* Open Profile */}
                          <button
                            onClick={() => handleOpenProfile(student)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hồ sơ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Student count and Page size selection */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <div className="flex items-center space-x-2">
            <span>Hiển thị {paginatedStudents.length} / {filteredStudents.length} học sinh (Tổng sĩ số: 42 em)</span>
            <span>·</span>
            <span>Chế độ:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-md px-2 py-0.5 font-bold text-slate-700 cursor-pointer"
            >
              <option value={42}>Xem tất cả 42 em (cuộn trực tiếp)</option>
              <option value={15}>15 em / trang</option>
              <option value={20}>20 em / trang</option>
            </select>
          </div>

          {pageSize < filteredStudents.length && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">Trang {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED STUDENT PROFILE MODAL / DRAWER */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="w-11 h-11 rounded-2xl bg-white/20 p-0.5 border border-white/20 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2 truncate">
                    <span>{activeStudent.name}</span>
                    <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {activeStudent.studentCode || `HS5B2-${activeStudent.id}`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeStudent.group || 'Tổ 1'} · Mã PIN Phụ huynh: <strong className="text-amber-300">{activeStudent.parentPin || '1234'}</strong> · Lớp 5B.2
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã lưu thành công hồ sơ và nhận xét của học sinh!</span>
                </div>
              )}

              {/* Quick Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Tích lũy Xu</div>
                  <div className="text-lg font-black text-amber-600 mt-0.5">🪙 {activeStudent.coins} Xu</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Sao rèn luyện</div>
                  <div className="text-lg font-black text-purple-600 mt-0.5">⭐ {activeStudent.stars} Sao</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Tổ học tập</div>
                  <div className="text-lg font-black text-blue-600 mt-0.5">{activeStudent.group || 'Tổ 1'}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Chuyên cần</div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">Có mặt</div>
                </div>
              </div>

              {/* Task History for this Student with Interactive Grading */}
              <div className="space-y-3">
                {(() => {
                  const applicableStudentTasks = filteredTasks.filter((task) => {
                    return (
                      task.assignedToType === 'all' ||
                      (task.assignedToType === 'group' && activeStudent.group === task.assignedGroup) ||
                      (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(activeStudent.id))
                    );
                  });

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900">
                          Lịch Sử Nhiệm Vụ ({selectedWeek})
                        </h4>
                        <span className="text-xs text-slate-500 font-semibold">
                          {applicableStudentTasks.length} nhiệm vụ áp dụng
                        </span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {applicableStudentTasks.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100">
                            Không có nhiệm vụ nào được giao cho học sinh này trong tuần đang chọn.
                          </div>
                        ) : (
                          applicableStudentTasks.map((task) => {
                            const rec = task.studentRecords[activeStudent.id];
                            const status = rec?.status || 'not_started';

                            const getStatusBadge = () => {
                              if (status === 'completed') {
                                return (
                                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-md">
                                    Đã hoàn thành {rec?.score !== undefined ? `(${rec.score}đ)` : ''}
                                  </span>
                                );
                              }
                              if (status === 'submitted') {
                                return (
                                  <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-md">
                                    Đã nộp · Chờ chấm
                                  </span>
                                );
                              }
                              if (status === 'needs_revision') {
                                return (
                                  <span className="bg-orange-100 text-orange-800 text-[11px] font-black px-2 py-0.5 rounded-md">
                                    Cần sửa lại
                                  </span>
                                );
                              }
                              return (
                                <span className="bg-slate-100 text-slate-600 text-[11px] font-black px-2 py-0.5 rounded-md">
                                  Chưa nộp
                                </span>
                              );
                            };

                            return (
                              <div
                                key={task.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                              >
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-black text-blue-700">{task.subject}:</span>
                                    <span className="font-bold text-slate-900">{task.title}</span>
                                  </div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    Hạn nộp: {task.dueDate} · Thưởng: +{task.rewardCoins} Xu
                                  </div>
                                  {rec?.note && (
                                    <div className="text-amber-800 italic mt-0.5">
                                      Ghi chú: {rec.note}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                  {getStatusBadge()}
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateStudentTaskStatus(
                                          task.id,
                                          activeStudent.id,
                                          'completed',
                                          'Cô Kim Tiến đã chấm: Đạt yêu cầu tốt!',
                                          10
                                        );
                                        soundEffects.playCorrect();
                                        confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
                                      }}
                                      title="Chấm Đạt 10 điểm"
                                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-md text-[10px] font-bold border border-emerald-200 transition-colors"
                                    >
                                      ✅ Đạt
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateStudentTaskStatus(
                                          task.id,
                                          activeStudent.id,
                                          'needs_revision',
                                          'Cần làm lại và nộp bổ sung'
                                        );
                                        soundEffects.playCoin();
                                      }}
                                      title="Cần sửa lại bài"
                                      className="px-2 py-0.5 bg-orange-50 hover:bg-orange-600 text-orange-800 hover:text-white rounded-md text-[10px] font-bold border border-orange-200 transition-colors"
                                    >
                                      🔄 Sửa
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Editable Teacher Notes & Comments Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-3 border-t border-slate-200">
                <h4 className="text-sm font-black text-slate-900">
                  Nhận Xét & Ghi Chú Của Giáo Viên Chủ Nhiệm (Cô Kim Tiến)
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhận xét học tập định kỳ
                  </label>
                  <textarea
                    rows={2}
                    value={editComments}
                    onChange={(e) => setEditComments(e.target.value)}
                    placeholder="Ví dụ: Em có tiến bộ vượt bậc môn Toán, chữ viết cẩn thận, tích cực phát biểu..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mục tiêu rèn luyện & Tiến bộ
                  </label>
                  <input
                    type="text"
                    value={editGoals}
                    onChange={(e) => setEditGoals(e.target.value)}
                    placeholder="Ví dụ: Đạt 100% bài tập Toán cuối tuần, tự tin thuyết trình trước lớp"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStudent(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Nhận Xét</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
