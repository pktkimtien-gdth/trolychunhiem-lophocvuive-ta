import React, { useState, useMemo } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { ClassTask, Student, TaskStudentStatus } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  ArrowRight,
  TrendingUp,
  Search,
  Check,
  Calendar,
  Sparkles,
  BookOpen,
  MessageSquare,
  Send,
  AlertCircle,
  Download,
  Zap,
  Award
} from 'lucide-react';

interface LMSOverviewProps {
  onNavigateToTab: (tab: string, filterParams?: any) => void;
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  onOpenCreateTask: () => void;
}

export const LMSOverview: React.FC<LMSOverviewProps> = ({
  onNavigateToTab,
  selectedWeek,
  setSelectedWeek,
  onOpenCreateTask,
}) => {
  const { students, classTasks, updateStudentTaskStatus, awardCoins } = useClassroom();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'needs_grading' | 'overdue' | 'needs_revision'>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Available subjects for filter
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

  const availableWeeks = ['Tuần 24', 'Tuần 23', 'Tuần 22', 'Tất cả các tuần'];

  // Filter tasks based on selected week and subject
  const currentTasks = useMemo(() => {
    return classTasks.filter((task) => {
      const matchWeek =
        selectedWeek === 'Tất cả các tuần' ||
        (task.week && task.week.toLowerCase() === selectedWeek.toLowerCase()) ||
        (!task.week && selectedWeek === 'Tuần 24');
      const matchSubject =
        selectedSubject === 'all' ||
        task.subject.toLowerCase() === selectedSubject.toLowerCase();
      return matchWeek && matchSubject;
    });
  }, [classTasks, selectedWeek, selectedSubject]);

  // Calculate real-time dynamic statistics
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const taskCount = currentTasks.length;

    if (taskCount === 0) {
      return {
        totalStudents,
        taskCount: 0,
        fullyCompletedStudents: 0,
        pendingReviewStudents: 0,
        missingStudents: 0,
        overallCompletionRate: 0,
        needsActionItems: [],
        studentsNeedingFollowup: [],
        counts: { grading: 0, overdue: 0, revision: 0 },
      };
    }

    let fullyCompletedCount = 0;
    let pendingReviewCount = 0;
    let missingCount = 0;

    const needsActionList: {
      taskId: string;
      taskTitle: string;
      subject: string;
      studentId: string;
      studentName: string;
      studentAvatar: string;
      studentGroup: string;
      studentPin: string;
      type: 'needs_grading' | 'overdue' | 'needs_revision';
      dueDate: string;
      note?: string;
    }[] = [];

    const followupMap = new Map<
      string,
      { student: Student; missingCount: number; needsRevisionCount: number; overdueCount: number }
    >();

    const todayStr = new Date().toISOString().split('T')[0];

    students.forEach((student) => {
      let studentApplicableTasks = 0;
      let studentCompletedTasks = 0;
      let hasPending = false;
      let hasMissing = false;

      currentTasks.forEach((task) => {
        const isApplicable =
          task.assignedToType === 'all' ||
          (task.assignedToType === 'group' && student.group === task.assignedGroup) ||
          (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(student.id));

        if (!isApplicable) return;
        studentApplicableTasks++;

        const record = task.studentRecords[student.id] || { status: 'not_started' };
        const isCompleted = record.status === 'completed';
        const isSubmitted = record.status === 'submitted';
        const isNeedsRevision = record.status === 'needs_revision';
        const isLate = record.status === 'late';
        const isOverdue =
          !isCompleted &&
          !isSubmitted &&
          !isNeedsRevision &&
          (isLate || (task.dueDate && task.dueDate < todayStr));

        if (isCompleted) {
          studentCompletedTasks++;
        } else if (isSubmitted) {
          hasPending = true;
          needsActionList.push({
            taskId: task.id,
            taskTitle: task.title,
            subject: task.subject,
            studentId: student.id,
            studentName: student.name,
            studentAvatar: student.avatar,
            studentGroup: student.group || 'Tổ 1',
            studentPin: student.parentPin || '1234',
            type: 'needs_grading',
            dueDate: task.dueDate,
            note: record.note,
          });
        } else if (isNeedsRevision) {
          hasPending = true;
          needsActionList.push({
            taskId: task.id,
            taskTitle: task.title,
            subject: task.subject,
            studentId: student.id,
            studentName: student.name,
            studentAvatar: student.avatar,
            studentGroup: student.group || 'Tổ 1',
            studentPin: student.parentPin || '1234',
            type: 'needs_revision',
            dueDate: task.dueDate,
            note: record.note,
          });
        } else if (isOverdue) {
          hasMissing = true;
          needsActionList.push({
            taskId: task.id,
            taskTitle: task.title,
            subject: task.subject,
            studentId: student.id,
            studentName: student.name,
            studentAvatar: student.avatar,
            studentGroup: student.group || 'Tổ 1',
            studentPin: student.parentPin || '1234',
            type: 'overdue',
            dueDate: task.dueDate,
            note: 'Đã quá thời hạn nộp bài',
          });
        } else {
          hasMissing = true;
        }

        if (!isCompleted) {
          const existing = followupMap.get(student.id) || {
            student,
            missingCount: 0,
            needsRevisionCount: 0,
            overdueCount: 0,
          };
          if (isOverdue) existing.overdueCount++;
          if (isNeedsRevision) existing.needsRevisionCount++;
          if (record.status === 'not_started' || record.status === 'in_progress') existing.missingCount++;
          followupMap.set(student.id, existing);
        }
      });

      if (studentApplicableTasks > 0) {
        if (studentCompletedTasks === studentApplicableTasks) {
          fullyCompletedCount++;
        } else if (hasPending) {
          pendingReviewCount++;
        } else if (hasMissing) {
          missingCount++;
        }
      }
    });

    const completionRate =
      totalStudents > 0 ? Math.round((fullyCompletedCount / totalStudents) * 100) : 0;

    const followupList = Array.from(followupMap.values())
      .filter((item) => item.missingCount > 0 || item.overdueCount > 0 || item.needsRevisionCount > 0)
      .sort((a, b) => b.overdueCount * 3 + b.missingCount - (a.overdueCount * 3 + a.missingCount));

    const gradingCount = needsActionList.filter((i) => i.type === 'needs_grading').length;
    const overdueCount = needsActionList.filter((i) => i.type === 'overdue').length;
    const revisionCount = needsActionList.filter((i) => i.type === 'needs_revision').length;

    return {
      totalStudents,
      taskCount,
      fullyCompletedStudents: fullyCompletedCount,
      pendingReviewStudents: pendingReviewCount,
      missingStudents: missingCount,
      overallCompletionRate: completionRate,
      needsActionItems: needsActionList,
      studentsNeedingFollowup: followupList.slice(0, 8),
      counts: { grading: gradingCount, overdue: overdueCount, revision: revisionCount },
    };
  }, [students, currentTasks]);

  // Filtered action items based on sub-tab
  const filteredActionItems = useMemo(() => {
    if (actionFilter === 'all') return stats.needsActionItems;
    return stats.needsActionItems.filter((item) => item.type === actionFilter);
  }, [stats.needsActionItems, actionFilter]);

  // Quick Action: Approve single task with 10 pts
  const handleQuickApprove = (taskId: string, studentId: string, studentName: string) => {
    updateStudentTaskStatus(taskId, studentId, 'completed', 'Cô Kim Tiến đã chấm: Đạt yêu cầu tốt!', 10);
    soundEffects.playCorrect();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    setActionSuccessMsg(`Đã duyệt hoàn thành bài tập cho em ${studentName} (10 điểm & thưởng Xu)!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Bulk Action: Approve all pending grading tasks at once
  const handleApproveAllPending = () => {
    const pendingItems = stats.needsActionItems.filter((i) => i.type === 'needs_grading');
    if (pendingItems.length === 0) return;

    pendingItems.forEach((item) => {
      updateStudentTaskStatus(item.taskId, item.studentId, 'completed', 'Cô Kim Tiến đã chấm: Đạt yêu cầu tốt!', 10);
    });

    soundEffects.playCorrect();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    setActionSuccessMsg(`Đã duyệt hoàn thành xuất sắc ${pendingItems.length} bài tập đang chờ chấm!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Export reminders CSV for parents / Zalo class group
  const handleExportReminders = () => {
    const overdueOrMissing = stats.needsActionItems.filter((i) => i.type === 'overdue' || i.type === 'needs_revision');
    if (overdueOrMissing.length === 0) {
      setActionSuccessMsg('Không có học sinh nào bị quá hạn nộp bài trong tuần này!');
      setTimeout(() => setActionSuccessMsg(null), 2500);
      return;
    }

    const headers = ['STT', 'Họ và Tên', 'Tổ', 'Môn Học', 'Nhiệm Vụ Cần Xử Lý', 'Hạn Nộp', 'Trạng Thái', 'Mã PIN Phụ Huynh'];
    const rows = overdueOrMissing.map((item, idx) => [
      idx + 1,
      `"${item.studentName}"`,
      `"${item.studentGroup}"`,
      `"${item.subject}"`,
      `"${item.taskTitle.replace(/"/g, '""')}"`,
      item.dueDate,
      item.type === 'overdue' ? '"Quá hạn nộp bài"' : '"Cần chỉnh sửa lại bài"',
      item.studentPin,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nhac_Nho_Bai_Tap_${selectedWeek}_Lop5B2.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    soundEffects.playCoin();
    setActionSuccessMsg(`Đã xuất danh sách ${overdueOrMissing.length} học sinh cần nhắc nhở thành công!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Quick Encourage with +5 Coins
  const handleQuickEncourage = (student: Student) => {
    awardCoins(student.id, 5);
    soundEffects.playCoin();
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
    setActionSuccessMsg(`Đã tặng +5 Xu động viên tinh thần cho em ${student.name}!`);
    setTimeout(() => setActionSuccessMsg(null), 2500);
  };

  return (
    <div className="space-y-5 font-['Quicksand',sans-serif]">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Control Bar: Class Context & Global Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
            <span className="font-black text-blue-700 uppercase tracking-wider">LỚP 5B.2</span>
            <span>·</span>
            <span>Sĩ số: 42 học sinh</span>
            <span>·</span>
            <span>GVCN: Cô Kim Tiến</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Bàn Làm Việc Giáo Viên Chủ Nhiệm
          </h1>
        </div>

        {/* Filters & Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Create Task Button */}
          <button
            onClick={onOpenCreateTask}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <span>+ Giao bài tập mới</span>
          </button>
        </div>
      </div>

      {/* 4 Focused Real-Time Metric Cards (Anti-Clutter, Clickable for 1-Click Drilldown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Card 1: Tổng sĩ số 42 */}
        <div
          onClick={() => onNavigateToTab('students')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          title="Bấm để xem danh sách 42 học sinh"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>SĨ SỐ LỚP 5B.2</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalStudents} <span className="text-xs text-slate-400 font-bold">em</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Tổ 1: 11 · Tổ 2: 11 · Tổ 3: 10 · Tổ 4: 10
            </div>
          </div>
        </div>

        {/* Card 2: Hoàn thành đầy đủ */}
        <div
          onClick={() => onNavigateToTab('students', { filterStatus: 'completed' })}
          className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          title="Bấm để lọc học sinh hoàn thành 100%"
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>HOÀN THÀNH 100%</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {stats.fullyCompletedStudents}
              <span className="text-xs text-emerald-600 font-bold ml-1.5">
                ({stats.overallCompletionRate}%)
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Đã xong toàn bộ bài trong tuần
            </div>
          </div>
        </div>

        {/* Card 3: Chờ chấm & Cần sửa */}
        <div
          onClick={() => {
            setActionFilter('needs_grading');
          }}
          className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          title="Bấm để lọc bài chờ chấm"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>CHỜ CHẤM & CẦN SỬA</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {stats.counts.grading + stats.counts.revision}
              <span className="text-xs text-amber-600 font-bold ml-1.5">bài</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {stats.counts.grading} bài nộp mới · {stats.counts.revision} bài cần sửa
            </div>
          </div>
        </div>

        {/* Card 4: Quá hạn / Chưa nộp */}
        <div
          onClick={() => onNavigateToTab('students', { filterStatus: 'needs_followup' })}
          className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          title="Bấm để xem danh sách cần nhắc nhở"
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>QUÁ HẠN / TRỄ</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {stats.counts.overdue}
              <span className="text-xs text-rose-500 font-bold ml-1.5">lượt</span>
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              Cần nhắc nhở trước khi hết tuần
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Workstation (Two Columns: Priority Action Queue & Student Follow-up) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Việc Cần Xử Lý Ngay */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col min-w-0">
          {/* Section Header with Segmented Filters & Bulk Tools */}
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
              <h2 className="text-base font-black text-slate-900 whitespace-nowrap">
                Việc Cần Xử Lý
              </h2>
              <span className="text-xs text-slate-600 font-bold whitespace-nowrap bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                {filteredActionItems.length} việc
              </span>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
              {stats.counts.grading > 0 && (
                <button
                  onClick={handleApproveAllPending}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1 shrink-0 whitespace-nowrap cursor-pointer"
                  title="Duyệt 10 điểm cho tất cả học sinh đã nộp bài"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Duyệt tất cả chờ chấm ({stats.counts.grading})</span>
                </button>
              )}

              {stats.counts.overdue > 0 && (
                <button
                  onClick={handleExportReminders}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shrink-0 whitespace-nowrap cursor-pointer"
                  title="Tải file CSV danh sách học sinh quá hạn để gửi Zalo phụ huynh"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất nhắc nhở (CSV)</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filter Tabs */}
          <div className="flex items-center space-x-1 py-2.5 overflow-x-auto text-xs font-bold border-b border-slate-100">
            <button
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                actionFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả ({stats.needsActionItems.length})
            </button>
            <button
              onClick={() => setActionFilter('needs_grading')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                actionFilter === 'needs_grading'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>Chờ chấm</span>
              <span className="opacity-90">({stats.counts.grading})</span>
            </button>
            <button
              onClick={() => setActionFilter('overdue')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                actionFilter === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-800 hover:bg-rose-50'
              }`}
            >
              <span>Quá hạn</span>
              <span className="opacity-90">({stats.counts.overdue})</span>
            </button>
            <button
              onClick={() => setActionFilter('needs_revision')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                actionFilter === 'needs_revision'
                  ? 'bg-orange-600 text-white'
                  : 'text-orange-800 hover:bg-orange-50'
              }`}
            >
              <span>Cần sửa</span>
              <span className="opacity-90">({stats.counts.revision})</span>
            </button>
          </div>

          {/* Action Items List */}
          <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100 pr-1 mt-1">
            {filteredActionItems.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-black text-slate-800">
                  Chưa có việc cần xử lý
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Mọi bài tập đã được chấm hoặc lớp đang hoàn thành đúng tiến độ.
                </p>
              </div>
            ) : (
              filteredActionItems.map((item, idx) => (
                <div
                  key={`${item.taskId}-${item.studentId}-${idx}`}
                  className="py-2.5 px-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img
                      src={item.studentAvatar}
                      alt={item.studentName}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                        <span className="font-bold text-slate-900 truncate">
                          {item.studentName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                          ({item.studentGroup})
                        </span>
                        {item.type === 'needs_grading' && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md whitespace-nowrap">
                            Chờ chấm
                          </span>
                        )}
                        {item.type === 'overdue' && (
                          <span className="text-[10px] font-black text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md whitespace-nowrap">
                            Quá hạn ({item.dueDate})
                          </span>
                        )}
                        {item.type === 'needs_revision' && (
                          <span className="text-[10px] font-black text-orange-800 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded-md whitespace-nowrap">
                            Cần sửa lại
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 truncate mt-0.5">
                        <strong className="text-slate-700">{item.subject}:</strong> {item.taskTitle}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-amber-800 italic truncate mt-0.5">
                          "{item.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                    {item.type === 'needs_grading' && (
                      <button
                        onClick={() => handleQuickApprove(item.taskId, item.studentId, item.studentName)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-bold shadow-xs transition-all flex items-center space-x-1 text-xs whitespace-nowrap cursor-pointer"
                        title="Duyệt hoàn thành và thưởng xu ngay"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Duyệt 10đ</span>
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateToTab('progress', { studentId: item.studentId, taskId: item.taskId })}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg font-bold transition-all text-xs whitespace-nowrap cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Học Sinh Cần Quan Tâm Nhất */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <h2 className="text-base font-black text-slate-900">
                  Học Sinh Cần Hỗ Trợ
                </h2>
              </div>
              <button
                onClick={() => onNavigateToTab('students', { filterStatus: 'needs_followup' })}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Xem tất cả
              </button>
            </div>

            {stats.studentsNeedingFollowup.length === 0 ? (
              <div className="py-12 text-center">
                <Sparkles className="w-9 h-9 text-amber-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  Cả lớp đều học tập rất tốt!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Không có học sinh nào bị tồn đọng bài tập trễ hạn trong tuần.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-1 max-h-[380px] overflow-y-auto pr-1 text-xs">
                {stats.studentsNeedingFollowup.map((item) => (
                  <div
                    key={item.student.id}
                    className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div
                      onClick={() => onNavigateToTab('students', { studentId: item.student.id })}
                      className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1"
                    >
                      <img
                        src={item.student.avatar}
                        alt={item.student.name}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {item.student.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.student.group || 'Tổ 1'} · PIN: {item.student.parentPin || '1234'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {item.overdueCount > 0 ? (
                        <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                          Trễ {item.overdueCount}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          Thiếu {item.missingCount}
                        </span>
                      )}

                      {/* Quick Encourage */}
                      <button
                        onClick={() => handleQuickEncourage(item.student)}
                        title="Tặng +5 Xu khích lệ em cố gắng"
                        className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ưu tiên học sinh có bài trễ.</span>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-blue-600 hover:underline font-bold"
            >
              Báo cáo tuần &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
