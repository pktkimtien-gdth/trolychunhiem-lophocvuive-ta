import React, { useState, useMemo } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import {
  Student,
  ClassTask,
  TaskStudentStatus,
  RewardHistoryItem,
  SeatingPlan,
  StudentReminder
} from '../types';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { NEUTRAL_AVATARS } from '../utils/studentAvatar';
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  ClipboardList,
  TrendingUp,
  BellRing,
  Award,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  Eye,
  X,
  Sparkles,
  Heart,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Calendar,
  Save,
  UserCheck,
  Layers,
  HelpCircle
} from 'lucide-react';

export const HomeroomAssistantView: React.FC = () => {
  const {
    students,
    desks,
    updateDeskStudent,
    updateStudent,
    addStudent,
    deleteStudent,
    bulkImportStudents,
    classTasks,
    addClassTask,
    updateClassTask,
    deleteClassTask,
    updateStudentTaskStatus,
    bulkUpdateStudentTaskStatus,
    rewardHistory,
    recordReward,
    revokeReward,
    seatingPlans,
    saveSeatingPlan,
    applySeatingPlan,
    deleteSeatingPlan,
    updateStudentAvatar,
    exportClassroomDataJSON,
    importClassroomDataJSON,
    resetAllData,
  } = useClassroom();

  // 9 Phân Hệ Quản Trị
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'students'
    | 'seating'
    | 'tasks'
    | 'progress'
    | 'reminders'
    | 'rewards'
    | 'reports'
    | 'settings'
  >('dashboard');

  // Search & Filter Global/Local
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');

  // Modal Hồ Sơ Chi Tiết Học Sinh
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Modal Tạo Nhiệm Vụ Mới
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Tiếng Việt');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-10-18');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCoins, setNewTaskCoins] = useState(10);
  const [newTaskCriteria, setNewTaskCriteria] = useState('');

  // Modal Khen Thưởng
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardStudentId, setRewardStudentId] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<number>(5);
  const [rewardReason, setRewardReason] = useState<string>('Hoàn thành nhiệm vụ đúng hạn');
  const [rewardBadge, setRewardBadge] = useState<string>('Ngôi sao chăm chỉ');

  // Seating Chart Drag & Drop & Swap State
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [selectedDeskForSwap, setSelectedDeskForSwap] = useState<string | null>(null);
  const [seatingPlanName, setSeatingPlanName] = useState('');
  const [highlightStudentId, setHighlightStudentId] = useState<string | null>(null);

  // Toast / Notification
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. DASHBOARD METRICS CALCULATION
  const dashboardStats = useMemo(() => {
    let totalAssignments = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let submittedCount = 0;
    let overdueCount = 0;

    const todayStr = '2026-10-15';

    classTasks.forEach((task) => {
      const isPastDue = task.dueDate < todayStr;
      students.forEach((st) => {
        totalAssignments++;
        const rec = task.studentRecords[st.id]?.status || 'not_started';
        if (rec === 'completed') completedCount++;
        else if (rec === 'submitted') submittedCount++;
        else if (rec === 'in_progress') inProgressCount++;
        else {
          notStartedCount++;
          if (isPastDue) overdueCount++;
        }
      });
    });

    const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;
    const weeklyRewardsCount = rewardHistory.length;

    return {
      totalStudents: students.length,
      totalTasks: classTasks.length,
      totalAssignments,
      completedCount,
      inProgressCount,
      notStartedCount,
      submittedCount,
      overdueCount,
      completionRate,
      weeklyRewardsCount,
    };
  }, [students, classTasks, rewardHistory]);

  // 2. NHẮC NHỞ HÔM NAY CALCULATION
  const remindersList = useMemo(() => {
    const todayStr = '2026-10-15';
    const list: StudentReminder[] = [];

    classTasks.forEach((task) => {
      students.forEach((st) => {
        const rec = task.studentRecords[st.id];
        const status = rec?.status || 'not_started';

        if (status === 'not_started' || status === 'needs_revision' || (status === 'in_progress' && task.dueDate <= todayStr)) {
          let gentleMsg = '';
          if (status === 'needs_revision') {
            gentleMsg = `Cô Kim Tiến nhắn con ${st.name}: Bài tập "${task.title}" môn ${task.subject} của con rất tốt, con xem lại góp ý nhỏ của cô để hoàn thiện xuất sắc hơn nhé!`;
          } else if (task.dueDate === todayStr) {
            gentleMsg = `Cô Kim Tiến nhắc con ${st.name}: Nhiệm vụ "${task.title}" môn ${task.subject} đến hạn hôm nay rồi đó. Con kiểm tra lại bài và nộp cho cô nhé!`;
          } else if (task.dueDate < todayStr) {
            gentleMsg = `Cô Kim Tiến gửi lời chào con ${st.name}! Cô chưa ghi nhận bài nộp nhiệm vụ "${task.title}" của con. Con kiểm tra lại giúp cô để nhận điểm thưởng nhé!`;
          } else {
            gentleMsg = `Con ${st.name} hãy kiểm tra lại nhiệm vụ "${task.title}" môn ${task.subject} và hoàn thành trước thời hạn ${task.dueDate} nhé!`;
          }

          list.push({
            id: `rem-${task.id}-${st.id}`,
            studentId: st.id,
            studentName: st.name,
            studentCode: st.studentCode || `HS5B2-${st.id}`,
            taskId: task.id,
            taskTitle: task.title,
            dueDate: task.dueDate,
            status,
            message: gentleMsg,
            copied: false,
          });
        }
      });
    });

    return list;
  }, [classTasks, students]);

  // Copy Reminder Message Handler
  const handleCopyReminder = (item: StudentReminder) => {
    navigator.clipboard.writeText(item.message);
    setCopiedReminderId(item.id);
    soundEffects.playClick();
    showToast(`Đã sao chép lời nhắc tích cực cho em ${item.studentName}!`);
    setTimeout(() => setCopiedReminderId(null), 2500);
  };

  // Seating Desk Swap Handler
  const handleDeskClick = (deskId: string, studentId?: string) => {
    soundEffects.playClick();
    if (!selectedDeskForSwap) {
      setSelectedDeskForSwap(deskId);
      showToast('Đã chọn bàn. Hãy bấm vào một bàn khác để hoán đổi chỗ ngồi!');
    } else {
      if (selectedDeskForSwap === deskId) {
        setSelectedDeskForSwap(null);
        return;
      }

      // Perform swap between selectedDeskForSwap and deskId
      const desk1 = desks.find((d) => d.id === selectedDeskForSwap);
      const desk2 = desks.find((d) => d.id === deskId);

      if (desk1 && desk2) {
        const student1Id = desk1.studentId;
        const student2Id = desk2.studentId;

        updateDeskStudent(desk1.id, student2Id);
        updateDeskStudent(desk2.id, student1Id);

        // Update student row/col in student records
        if (student1Id) {
          const st1 = students.find((s) => s.id === student1Id);
          if (st1) updateStudent({ ...st1, deskId: desk2.id, row: desk2.row, col: desk2.col });
        }
        if (student2Id) {
          const st2 = students.find((s) => s.id === student2Id);
          if (st2) updateStudent({ ...st2, deskId: desk1.id, row: desk1.row, col: desk1.col });
        }

        soundEffects.playWorksheetComplete();
        showToast('Hoán đổi vị trí chỗ ngồi thành công và đã tự động lưu dữ liệu!');
      }

      setSelectedDeskForSwap(null);
    }
  };

  // Handle Drag & Drop
  const handleDragStart = (studentId: string) => {
    setDraggedStudentId(studentId);
  };

  const handleDropOnDesk = (targetDeskId: string) => {
    if (!draggedStudentId) return;

    const sourceDesk = desks.find((d) => d.studentId === draggedStudentId);
    const targetDesk = desks.find((d) => d.id === targetDeskId);

    if (targetDesk && sourceDesk) {
      const occupantId = targetDesk.studentId;
      updateDeskStudent(targetDesk.id, draggedStudentId);
      updateDeskStudent(sourceDesk.id, occupantId);

      // Update student profile positions
      const stDragged = students.find((s) => s.id === draggedStudentId);
      if (stDragged) {
        updateStudent({ ...stDragged, deskId: targetDesk.id, row: targetDesk.row, col: targetDesk.col });
      }
      if (occupantId) {
        const stOccupant = students.find((s) => s.id === occupantId);
        if (stOccupant) {
          updateStudent({ ...stOccupant, deskId: sourceDesk.id, row: sourceDesk.row, col: sourceDesk.col });
        }
      }

      soundEffects.playWorksheetComplete();
      showToast('Đã chuyển chỗ ngồi thành công!');
    }

    setDraggedStudentId(null);
  };

  // Save new seating plan
  const handleSavePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatingPlanName.trim()) return;
    saveSeatingPlan(seatingPlanName.trim());
    setSeatingPlanName('');
    showToast('Đã lưu phương án sơ đồ chỗ ngồi mới thành công!');
  };

  // Create Task Submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const initialRecords: Record<string, { status: TaskStudentStatus }> = {};
    students.forEach((st) => {
      initialRecords[st.id] = { status: 'not_started' };
    });

    addClassTask({
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      description: newTaskDesc.trim() || 'Nhiệm vụ học tập theo kế hoạch tuần.',
      assignedDate: '2026-10-15',
      dueDate: newTaskDueDate,
      assignedToType: 'all',
      priority: newTaskPriority,
      criteria: newTaskCriteria.trim() || 'Hoàn thành đầy đủ, trình bày sạch đẹp',
      rewardCoins: Number(newTaskCoins),
      studentRecords: initialRecords,
    });

    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setShowCreateTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    showToast(`Đã giao nhiệm vụ mới: "${newTaskTitle}" cho 42 học sinh!`);
  };

  // Reward Submit
  const handleRewardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardStudentId) return;

    const targetStudent = students.find((s) => s.id === rewardStudentId);
    if (!targetStudent) return;

    recordReward({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      amount: Number(rewardAmount),
      reason: rewardReason.trim() || 'Có tiến bộ và nỗ lực trong học tập',
      badge: rewardBadge,
      recordedBy: 'Cô Kim Tiến',
    });

    soundEffects.playBigCoin();
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setShowRewardModal(false);
    showToast(`Đã khen thưởng ${rewardAmount} Xu cho em ${targetStudent.name}!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã HS', 'Họ và Tên', 'Tổ', 'Vị trí ghế', 'Số Xu thưởng', 'Số Sao', 'Nhận xét của GV'];
    const rows = students.map((s) => [
      s.studentCode || `HS5B2-${s.id}`,
      `"${s.name}"`,
      s.group || 'Tổ 1',
      `"Bàn ${s.deskId || ''}"`,
      s.coins,
      s.stars,
      `"${s.teacherComments || s.notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Hoc_Sinh_Lop_5B2_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Đã xuất danh sách 42 học sinh ra file CSV!');
  };

  // Backup JSON
  const handleBackupData = () => {
    const jsonStr = exportClassroomDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sao_Luu_Du_Lieu_Lop_5B2_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Đã tải file sao lưu dữ liệu toàn bộ lớp học!');
  };

  // Restore JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = importClassroomDataJSON(text);
        if (ok) {
          showToast('Khôi phục dữ liệu thành công!');
        } else {
          showToast('Lỗi định dạng file JSON. Vui lòng kiểm tra lại!');
        }
      }
    };
    reader.readAsText(file);
  };

  // Menu items for Sidebar
  const sidebarItems = [
    { id: 'dashboard', label: '1. Tổng quan lớp học', icon: LayoutDashboard, badge: null },
    { id: 'students', label: '2. Hồ sơ học sinh', icon: Users, badge: `${students.length} HS` },
    { id: 'seating', label: '3. Sơ đồ chỗ ngồi', icon: LayoutGrid, badge: '4 Dãy' },
    { id: 'tasks', label: '4. Bài tập & Nhiệm vụ', icon: ClipboardList, badge: `${classTasks.length}` },
    { id: 'progress', label: '5. Theo dõi tiến độ', icon: TrendingUp, badge: `${dashboardStats.completionRate}%` },
    { id: 'reminders', label: '6. Nhắc nhở hôm nay', icon: BellRing, badge: `${remindersList.length}`, badgeColor: 'bg-rose-500 text-white animate-pulse' },
    { id: 'rewards', label: '7. Khen thưởng & Động viên', icon: Award, badge: `${rewardHistory.length}` },
    { id: 'reports', label: '8. Báo cáo thống kê', icon: BarChart3, badge: 'Cuối tuần' },
    { id: 'settings', label: '9. Cài đặt & Sao lưu', icon: Settings, badge: null },
  ];

  return (
    <div className="bg-slate-50 min-h-[85vh] rounded-3xl border border-indigo-100 shadow-sm flex flex-col md:flex-row overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          {/* Header Brand */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-2xl p-4 text-white shadow-md shadow-indigo-600/15">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                vutoitruong
              </span>
              <span className="text-xs font-bold text-amber-200">Lớp 5B.2</span>
            </div>
            <h2 className="text-base font-extrabold tracking-tight mt-1.5">
              Trợ Lý Chủ Nhiệm
            </h2>
            <p className="text-[11px] text-white/80 mt-0.5 font-medium">
              GVCN: Cô Kim Tiến Number Hi! • Sĩ số: {students.length} HS
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab(item.id as any);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                        item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Footer inside Sidebar */}
        <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
          <div className="bg-amber-50 rounded-xl p-2.5 text-[11px] text-amber-900 border border-amber-200/60">
            <span className="font-bold flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Dữ liệu thực tế 100%</span>
            </span>
            <p className="text-[10px] text-amber-800 mt-0.5">
              Tự động lưu vào bộ nhớ trình duyệt, không mất khi tải lại trang.
            </p>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[85vh]">
        {/* SECTION 1: TỔNG QUAN LỚP HỌC (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Tổng Quan Lớp Học 5B.2 • Vui Đến Trường
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Bảng chỉ số học tập, tiến độ nhiệm vụ và hoạt động thi đua của 42 học sinh
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Giao Nhiệm Vụ Mới</span>
                </button>

                <button
                  onClick={() => setShowRewardModal(true)}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-pink-600/20"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Khen Thưởng (+Xu)</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Sĩ số lớp</span>
                <div className="text-2xl font-black text-slate-900">{dashboardStats.totalStudents} HS</div>
                <span className="text-[10px] text-emerald-600 font-bold">100% có mặt đủ</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1 bg-emerald-50/20">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Đã hoàn thành</span>
                <div className="text-2xl font-black text-emerald-700">{dashboardStats.completedCount}</div>
                <span className="text-[10px] text-emerald-600 font-bold">Tỉ lệ: {dashboardStats.completionRate}%</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1 bg-amber-50/20">
                <span className="text-[11px] font-bold text-amber-700 uppercase">Đang thực hiện</span>
                <div className="text-2xl font-black text-amber-700">{dashboardStats.inProgressCount}</div>
                <span className="text-[10px] text-amber-600 font-bold">Chờ nộp: {dashboardStats.submittedCount} bài</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs space-y-1 bg-rose-50/20">
                <span className="text-[11px] font-bold text-rose-700 uppercase">Cần nhắc nhở</span>
                <div className="text-2xl font-black text-rose-700">{remindersList.length}</div>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className="text-[10px] text-rose-600 hover:underline font-bold"
                >
                  Xem danh sách nhắc nhở &rarr;
                </button>
              </div>
            </div>

            {/* Biểu Đồ Môn Học & Tiến Độ Theo 4 Tổ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card A: Tiến độ theo môn học */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Tiến Độ Theo Môn Học (Lớp 5)</span>
                </h3>

                <div className="space-y-3 text-xs">
                  {[
                    { name: 'Toán', rate: 88, color: 'bg-blue-600' },
                    { name: 'Tiếng Việt', rate: 82, color: 'bg-rose-500' },
                    { name: 'Khoa học', rate: 75, color: 'bg-emerald-500' },
                    { name: 'Lịch sử và Địa lí', rate: 79, color: 'bg-amber-500' },
                    { name: 'Tin học & Công nghệ', rate: 92, color: 'bg-cyan-500' },
                  ].map((subj) => (
                    <div key={subj.name} className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{subj.name}</span>
                        <span>{subj.rate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${subj.color}`}
                          style={{ width: `${subj.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Tiến độ thi đua 4 Tổ */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Thi Đua Tự Chủ Học Tập Giữa 4 Tổ</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((grp, idx) => {
                    const groupStudents = students.filter((s) => s.group === grp);
                    const totalCoins = groupStudents.reduce((acc, s) => acc + s.coins, 0);

                    return (
                      <div key={grp} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-indigo-950">{grp}</span>
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            {groupStudents.length} HS
                          </span>
                        </div>
                        <div className="text-lg font-black text-amber-600">
                          🪙 {totalCoins} Xu
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Hoàn thành tốt các nhiệm vụ tuần 6
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Reminder Banner */}
            {remindersList.length > 0 && (
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200 p-4 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                    <BellRing className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-950">
                      Có {remindersList.length} lượt học sinh có nhiệm vụ sắp đến hạn hoặc cần góp ý
                    </h4>
                    <p className="text-xs text-rose-800">
                      Hệ thống đã tạo sẵn câu nhắc tích cực, nhẹ nhàng. Thầy cô chỉ cần bấm Sao chép để gửi phụ huynh/học sinh!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('reminders')}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap shadow-xs"
                >
                  Xử lý ngay &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: HỒ SƠ HỌC SINH (STUDENT PROFILES) */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Hồ Sơ Học Sinh Lớp 5B.2 ({students.length} Học Sinh)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Theo dõi quá trình học tập, lịch sử nộp bài, điểm thưởng và nhận xét của giáo viên
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất CSV</span>
                </button>

                <button
                  onClick={() => setShowRewardModal(true)}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>Khen Thưởng</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên học sinh, mã số HS (HS5B2-01)..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-1 self-start sm:self-auto text-xs font-bold">
                {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      selectedGroup === grp
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {grp === 'all' ? 'Tất cả các tổ' : grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Table / Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students
                .filter((st) => {
                  const matchQuery =
                    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (st.studentCode && st.studentCode.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchGroup = selectedGroup === 'all' || st.group === selectedGroup;
                  return matchQuery && matchGroup;
                })
                .map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentForProfile(student)}
                    className="group bg-white p-4 rounded-3xl border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md">
                            {student.studentCode || `HS5B2-${student.id}`}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {student.group || 'Tổ 1'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate mt-0.5">
                          {student.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {student.teacherComments || 'Chăm ngoan, nỗ lực trong học tập'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-black text-[11px]">
                          🪙 {student.coins} Xu
                        </span>
                        <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          ⭐ {student.stars} Sao
                        </span>
                      </div>

                      <span className="text-indigo-600 font-bold text-[11px] flex items-center space-x-0.5 group-hover:translate-x-1 transition-transform">
                        <span>Hồ sơ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SECTION 3: SƠ ĐỒ CHỖ NGỒI TƯƠNG TÁC (INTERACTIVE SEATING) */}
        {activeTab === 'seating' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Sơ Đồ Chỗ Ngồi Lớp 5B.2 (4 Dãy Bàn Đôi)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Bàn giáo viên phía trên • Kéo thả hoặc bấm chọn 2 chỗ ngồi để hoán đổi tức thì • Tự động lưu
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Sơ Đồ</span>
                </button>
              </div>
            </div>

            {/* Teacher Desk & Classroom Front Board */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-3.5 text-center text-white shadow-md">
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                BẢNG LỚP HỌC & BÀN GIÁO VIÊN (CÔ KIM TIẾN NUMBER HI!)
              </div>
            </div>

            {/* Plan switcher & Search highlight */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-600">Phương án sơ đồ:</span>
                <select
                  value={seatingPlans.find((p) => p.isCurrent)?.id || 'plan-1'}
                  onChange={(e) => applySeatingPlan(e.target.value)}
                  className="bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl font-bold text-indigo-900"
                >
                  {seatingPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Highlight Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm học sinh để làm nổi bật vị trí..."
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase().trim();
                    if (!q) {
                      setHighlightStudentId(null);
                    } else {
                      const found = students.find((s) => s.name.toLowerCase().includes(q));
                      setHighlightStudentId(found ? found.id : null);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                />
              </div>
            </div>

            {/* Grid of 4 Columns (Dãy 1 đến Dãy 4) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((colNum) => (
                <div key={colNum} className="space-y-3">
                  <div className="bg-indigo-600 text-white py-1.5 px-3 rounded-xl text-xs font-black text-center shadow-xs">
                    DÃY {colNum}
                  </div>

                  {/* 6 Desks per Column */}
                  {[1, 2, 3, 4, 5, 6].map((rowNum) => {
                    const tableNumber = (rowNum - 1) * 4 + colNum;
                    const deskLeft = desks.find((d) => d.row === rowNum && d.col === colNum && d.seat === 1);
                    const deskRight = desks.find((d) => d.row === rowNum && d.col === colNum && d.seat === 2);

                    const stLeft = students.find((s) => s.id === deskLeft?.studentId);
                    const stRight = students.find((s) => s.id === deskRight?.studentId);

                    return (
                      <div
                        key={rowNum}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-2.5 space-y-2 hover:border-indigo-300 transition-colors"
                      >
                        <div className="text-[10px] font-bold text-slate-400 text-center border-b border-slate-100 pb-1">
                          Bàn {tableNumber} (Hàng {rowNum})
                        </div>

                        {/* Two seats side by side */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* Seat 1 (Trái) */}
                          <div
                            draggable={!!stLeft}
                            onDragStart={() => stLeft && handleDragStart(stLeft.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => deskLeft && handleDropOnDesk(deskLeft.id)}
                            onClick={() => deskLeft && handleDeskClick(deskLeft.id, stLeft?.id)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[75px] ${
                              deskLeft && selectedDeskForSwap === deskLeft.id
                                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                                : stLeft && highlightStudentId === stLeft.id
                                ? 'bg-yellow-200 border-yellow-500 ring-2 ring-yellow-400'
                                : stLeft
                                ? 'bg-slate-50 border-slate-200 hover:bg-indigo-50'
                                : 'bg-slate-100/60 border-dashed border-slate-300'
                            }`}
                          >
                            {stLeft ? (
                              <>
                                <img
                                  src={stLeft.avatar}
                                  alt={stLeft.name}
                                  className="w-7 h-7 rounded-full mb-1 border border-indigo-200"
                                />
                                <span className="font-extrabold text-[11px] text-slate-900 line-clamp-1 leading-tight">
                                  {stLeft.name}
                                </span>
                                <span className="text-[9px] font-bold text-amber-700">
                                  🪙 {stLeft.coins}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">Trống</span>
                            )}
                          </div>

                          {/* Seat 2 (Phải) */}
                          <div
                            draggable={!!stRight}
                            onDragStart={() => stRight && handleDragStart(stRight.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => deskRight && handleDropOnDesk(deskRight.id)}
                            onClick={() => deskRight && handleDeskClick(deskRight.id, stRight?.id)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[75px] ${
                              deskRight && selectedDeskForSwap === deskRight.id
                                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                                : stRight && highlightStudentId === stRight.id
                                ? 'bg-yellow-200 border-yellow-500 ring-2 ring-yellow-400'
                                : stRight
                                ? 'bg-slate-50 border-slate-200 hover:bg-indigo-50'
                                : 'bg-slate-100/60 border-dashed border-slate-300'
                            }`}
                          >
                            {stRight ? (
                              <>
                                <img
                                  src={stRight.avatar}
                                  alt={stRight.name}
                                  className="w-7 h-7 rounded-full mb-1 border border-indigo-200"
                                />
                                <span className="font-extrabold text-[11px] text-slate-900 line-clamp-1 leading-tight">
                                  {stRight.name}
                                </span>
                                <span className="text-[9px] font-bold text-amber-700">
                                  🪙 {stRight.coins}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">Trống</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Save current plan box */}
            <form onSubmit={handleSavePlanSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <input
                type="text"
                value={seatingPlanName}
                onChange={(e) => setSeatingPlanName(e.target.value)}
                placeholder="Nhập tên phương án sơ đồ mới (ví dụ: Phương án Tuần 7 - Đổi chỗ luân phiên)..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
              >
                Lưu Thành Phương Án Mới
              </button>
            </form>
          </div>
        )}

        {/* SECTION 4: BÀI TẬP VÀ NHIỆM VỤ (TASKS) */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Quản Lý Bài Tập & Nhiệm Vụ Học Tập Lớp 5B.2
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Giao bài tập theo kế hoạch dạy học • Cập nhật nhanh trạng thái cho từng học sinh hoặc hàng loạt
                </p>
              </div>

              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Nhiệm Vụ Mới</span>
              </button>
            </div>

            {/* Task list with detailed per-student status editor */}
            <div className="space-y-4">
              {classTasks.map((task) => {
                const totalAssigned = students.length;
                let doneCount = 0;
                students.forEach((st) => {
                  if (task.studentRecords[st.id]?.status === 'completed') doneCount++;
                });
                const pct = Math.round((doneCount / totalAssigned) * 100);

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-50 text-indigo-700 font-black text-[11px] px-2.5 py-0.5 rounded-lg border border-indigo-200">
                            {task.subject}
                          </span>
                          <span className="bg-amber-100 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-md">
                            +{task.rewardCoins} Xu
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            Hạn nộp: {task.dueDate}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 mt-1.5">
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-700">{doneCount}/{totalAssigned} Đã hoàn thành</div>
                          <div className="text-[10px] text-emerald-600 font-bold">{pct}%</div>
                        </div>

                        {/* Quick Mark All Done */}
                        <button
                          type="button"
                          onClick={() => {
                            bulkUpdateStudentTaskStatus(task.id, students.map((s) => s.id), 'completed');
                            showToast('Đã cập nhật trạng thái hoàn thành cho toàn bộ lớp!');
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Duyệt cả lớp (+Xu)
                        </button>
                      </div>
                    </div>

                    {/* Quick Student Grid Status for this task */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                        <span>Trạng thái từng học sinh (Bấm để đổi nhanh):</span>
                        <span className="text-[11px] text-slate-400">
                          Xanh: Hoàn thành • Vàng: Đang làm • Đỏ: Cần sửa/Chưa làm
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-1.5 text-[11px]">
                        {students.map((st) => {
                          const rec = task.studentRecords[st.id] || { status: 'not_started' };
                          const isDone = rec.status === 'completed';
                          const isSub = rec.status === 'submitted';
                          const isRev = rec.status === 'needs_revision';

                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                // Cycle status: not_started -> in_progress -> submitted -> completed -> needs_revision
                                const nextStatus: TaskStudentStatus =
                                  rec.status === 'not_started'
                                    ? 'in_progress'
                                    : rec.status === 'in_progress'
                                    ? 'submitted'
                                    : rec.status === 'submitted'
                                    ? 'completed'
                                    : rec.status === 'completed'
                                    ? 'needs_revision'
                                    : 'not_started';

                                updateStudentTaskStatus(task.id, st.id, nextStatus);
                                soundEffects.playClick();
                              }}
                              className={`p-1.5 rounded-xl border text-left truncate transition-colors ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                  : isSub
                                  ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                                  : isRev
                                  ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                              title={`${st.name}: ${rec.status}`}
                            >
                              <div className="truncate font-semibold">{st.name}</div>
                              <div className="text-[9px] opacity-80">
                                {isDone ? '✓ Xong' : isSub ? 'Chờ duyệt' : isRev ? 'Cần sửa' : 'Chưa xong'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: THEO DÕI TIẾN ĐỘ (PROGRESS) */}
        {activeTab === 'progress' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200/80 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Theo Dõi Tiến Độ Học Tập Từng Học Sinh
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tỷ lệ hoàn thành nhiệm vụ và biểu dương học sinh có sự tiến bộ so với chính mình
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Mã HS</th>
                    <th className="py-2.5 px-3">Học Sinh</th>
                    <th className="py-2.5 px-3">Tổ</th>
                    <th className="py-2.5 px-3">Số Nhiệm Vụ Xong</th>
                    <th className="py-2.5 px-3">Tỷ Lệ</th>
                    <th className="py-2.5 px-3">Xu Thưởng</th>
                    <th className="py-2.5 px-3">Ghi Nhận Tiến Bộ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {students.map((st) => {
                    let doneCount = 0;
                    classTasks.forEach((t) => {
                      if (t.studentRecords[st.id]?.status === 'completed') doneCount++;
                    });
                    const pct = classTasks.length > 0 ? Math.round((doneCount / classTasks.length) * 100) : 0;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                          {st.studentCode || `HS5B2-${st.id}`}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-bold">{st.group || 'Tổ 1'}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">
                          {doneCount} / {classTasks.length}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-700">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-black text-amber-700">
                          🪙 {st.coins}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {pct >= 80 ? '🌟 Tiến bộ vượt bậc tuần này' : 'Đang duy trì nỗ lực'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 6: NHẮC NHỞ HỌC TẬP (MỤC NHẮC NHỞ HÔM NAY) */}
        {activeTab === 'reminders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
                  <span>Mục Nhắc Nhở Hôm Nay ({remindersList.length})</span>
                  <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    Tự Động Lọc
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tự động lọc học sinh có nhiệm vụ sắp đến hạn hoặc chưa hoàn thành • Lời nhắc lịch sự, tích cực, không trách móc học sinh
                </p>
              </div>
            </div>

            {remindersList.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Tuyệt vời! Không có học sinh nào bị quá hạn nhiệm vụ
                </h3>
                <p className="text-xs text-slate-500">
                  Tất cả các em học sinh Lớp 5B.2 đều đã hoàn thành đúng tiến độ.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {remindersList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-200/80 shadow-2xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="font-black text-sm text-slate-900">
                          {item.studentName}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.2 rounded-md">
                          {item.studentCode}
                        </span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.2 rounded-md">
                          Nhiệm vụ: {item.taskTitle}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Hạn chót: {item.dueDate}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                        💬 <span className="italic">"{item.message}"</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyReminder(item)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition-all shrink-0 ${
                        copiedReminderId === item.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {copiedReminderId === item.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-rose-600" />
                          <span>Sao chép tin nhắn</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 7: KHEN THƯỞNG VÀ ĐỘNG VIÊN (REWARDS) */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Khen Thưởng & Động Viên Tích Cực
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tuyên dương sự tiến bộ của từng học sinh • Cộng điểm thưởng, trao huy hiệu có lưu lịch sử
                </p>
              </div>

              <button
                onClick={() => setShowRewardModal(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-pink-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi Nhận Khen Thưởng Mới</span>
              </button>
            </div>

            {/* Reward History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                Lịch Sử Khen Thưởng & Điều Chỉnh Gần Đây
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                      <th className="py-2 px-3">Thời gian</th>
                      <th className="py-2 px-3">Học Sinh</th>
                      <th className="py-2 px-3">Số Xu</th>
                      <th className="py-2 px-3">Huy Hiệu</th>
                      <th className="py-2 px-3">Lý do ghi nhận</th>
                      <th className="py-2 px-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {rewardHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{item.createdAt}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.studentName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                              item.amount >= 0 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {item.amount >= 0 ? `+${item.amount}` : item.amount} Xu
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-purple-700">{item.badge || 'Khen ngợi'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.reason}</td>
                        <td className="py-2.5 px-3">
                          {item.amount > 0 && (
                            <button
                              onClick={() => {
                                const reason = prompt('Nhập lý do thu hồi điểm thưởng nhập nhầm:');
                                if (reason) revokeReward(item.id, reason);
                              }}
                              className="text-slate-400 hover:text-rose-600 font-bold text-[11px]"
                              title="Thu hồi điểm nhập nhầm"
                            >
                              Thu hồi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: BÁO CÁO THỐNG KÊ (BÁO CÁO CUỐI TUẦN) */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Báo Cáo Cuối Tuần Lớp 5B.2 (Tuần 6)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tổng hợp số nhiệm vụ được giao, hoàn thành, tỷ lệ và nhận xét chi tiết của giáo viên
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Excel/CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Báo Cáo PDF</span>
                </button>
              </div>
            </div>

            {/* Weekend Digest Summary Banner */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Nhận Xét Chung Của GVCN: Cô Kim Tiến Number Hi!
                  </h3>
                  <p className="text-xs text-slate-500">Lớp 5B.2 Vui Vẻ • Chiến dịch Vui Đến Trường</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-3 py-1 rounded-full">
                  Hoàn Thành 88% Mục Tiêu Tuần
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                "Trong tuần vừa qua, 42 học sinh Lớp 5B.2 đã thể hiện tinh thần tự chủ học tập rất đáng khen ngợi. Các em tích cực làm bài tập cuối tuần môn Toán và Tiếng Việt, đặc biệt là sự hợp tác sôi nổi trong các giờ Khoa Học và Tin Học. Các con cần tiếp tục duy trì nếp đọc sách và chuẩn bị bài trước khi đến lớp!"
              </p>
            </div>
          </div>
        )}

        {/* SECTION 9: CÀI ĐẶT VÀ SAO LƯU DỮ LIỆU (SETTINGS) */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200/80 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Cài Đặt & Sao Lưu Dữ Liệu
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sao lưu dữ liệu về máy tính an toàn • Nhập danh sách hoặc khôi phục dữ liệu khi cần
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Backup Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Sao Lưu Dữ Liệu Lớp Học (Tải File JSON)
                </h3>
                <p className="text-xs text-slate-500">
                  Xuất toàn bộ 42 hồ sơ học sinh, sơ đồ chỗ ngồi, nhiệm vụ và lịch sử khen thưởng thành file JSON để lưu trữ an toàn.
                </p>
                <button
                  onClick={handleBackupData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs"
                >
                  Tải Bản Sao Lưu Ngay
                </button>
              </div>

              {/* Restore Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Khôi Phục Dữ Liệu Từ File JSON
                </h3>
                <p className="text-xs text-slate-500">
                  Tải lại trạng thái lớp học từ bản sao lưu trước đó mà không làm mất thông tin học sinh.
                </p>
                <div>
                  <input
                    type="file"
                    id="restore-json-input"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="restore-json-input"
                    className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-block shadow-xs"
                  >
                    Chọn File JSON Khôi Phục
                  </label>
                </div>
              </div>
            </div>

            {/* Reset Data Danger Zone */}
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl space-y-2">
              <h4 className="font-black text-rose-950 text-xs">Khu vực đặt lại dữ liệu:</h4>
              <p className="text-xs text-rose-800">
                Bấm vào đây để tải lại bộ dữ liệu mẫu ban đầu gồm đầy đủ 42 học sinh Lớp 5B.2 Vui Vẻ, 24 bàn đôi và bài tập.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  showToast('Đã khôi phục dữ liệu mẫu thành công!');
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
              >
                Đặt Lại Dữ Liệu Mẫu Minh Họa
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: HỒ SƠ CHI TIẾT TỪNG HỌC SINH */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 overflow-hidden shrink-0">
                  <img
                    src={selectedStudentForProfile.avatar}
                    alt={selectedStudentForProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-base sm:text-lg text-slate-900">
                      {selectedStudentForProfile.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                      {selectedStudentForProfile.studentCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedStudentForProfile.group || 'Tổ 1'} • Vị trí: Bàn {selectedStudentForProfile.deskId || 'Chưa xếp'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForProfile(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Neutral Illustration Selector for this student */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Hình minh họa trang trí thân thiện:</span>
                <span className="text-[11px] text-slate-400">Hoa, lá, mây, mặt trời, ngôi sao, cầu vồng</span>
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                {NEUTRAL_AVATARS.map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    title={nav.name}
                    onClick={() => {
                      soundEffects.playClick();
                      updateStudentAvatar(selectedStudentForProfile.id, nav.svg);
                      setSelectedStudentForProfile({ ...selectedStudentForProfile, avatar: nav.svg });
                      showToast(`Đã chọn hình "${nav.name}" cho em ${selectedStudentForProfile.name}!`);
                    }}
                    className="w-9 h-9 rounded-xl border-2 hover:border-amber-400 p-0.5 bg-white shadow-2xs hover:scale-110 transition-all shrink-0 cursor-pointer"
                  >
                    <img src={nav.svg} alt={nav.name} className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            </div>

            {/* Goals & Teacher Comments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-900 block">🎯 Mục tiêu học tập:</span>
                <p className="text-indigo-800 font-normal">
                  {selectedStudentForProfile.goals || 'Phấn đấu đạt học sinh xuất sắc và rèn luyện nếp tự học'}
                </p>
              </div>

              <div className="bg-pink-50/50 p-3.5 rounded-2xl border border-pink-100 space-y-1">
                <span className="font-bold text-pink-900 block">👩‍🏫 Lời dặn của Cô Kim Tiến:</span>
                <p className="text-pink-800 font-normal">
                  {selectedStudentForProfile.teacherComments || 'Con rất chăm ngoan, tích cực phát biểu xây dựng bài.'}
                </p>
              </div>
            </div>

            {/* Academic Evaluation Scores */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">📊 Kết quả đánh giá các môn:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(selectedStudentForProfile.academicScores || {
                  'Toán': 9.0,
                  'Tiếng Việt': 8.5,
                  'Khoa học': 9.0,
                  'Lịch sử - Địa lí': 8.5,
                  'Tin học': 9.5
                }).map(([subj, score]) => (
                  <div key={subj} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block truncate">{subj}</span>
                    <span className="text-sm font-black text-indigo-900">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Buttons inside Profile */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-amber-700">
                🪙 Hiện có: {selectedStudentForProfile.coins} Xu • ⭐ {selectedStudentForProfile.stars} Sao
              </div>

              <button
                onClick={() => {
                  setRewardStudentId(selectedStudentForProfile.id);
                  setSelectedStudentForProfile(null);
                  setShowRewardModal(true);
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs"
              >
                + Khen Thưởng Em Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO NHIỆM VỤ MỚI */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                Giao Bài Tập & Nhiệm Vụ Mới Lớp 5B.2
              </h3>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên nhiệm vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập Đại từ & Viết đoạn văn ngắn tả cảnh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Toán">Toán</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Đạo đức">Đạo đức</option>
                    <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Yêu cầu & Nội dung</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Ghi rõ yêu cầu bài tập cho học sinh..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="high">Cao (Cần làm sớm)</option>
                    <option value="medium">Bình thường</option>
                    <option value="low">Tự chọn mở rộng</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm thưởng (Xu)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newTaskCoins}
                    onChange={(e) => setNewTaskCoins(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Giao Nhiệm Vụ Cho 42 Học Sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KHEN THƯỞNG */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-pink-100 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Award className="w-5 h-5 text-pink-500" />
                <span>Khen Thưởng & Động Viên (+Xu)</span>
              </h3>
              <button
                onClick={() => setShowRewardModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRewardSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn học sinh được khen thưởng <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={rewardStudentId}
                  onChange={(e) => setRewardStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="">-- Chọn một học sinh --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.studentCode ? `[${st.studentCode}] ` : ''}{st.name} ({st.group || 'Tổ 1'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do tích cực</label>
                <select
                  value={rewardReason}
                  onChange={(e) => setRewardReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="Hoàn thành nhiệm vụ đúng hạn">Hoàn thành nhiệm vụ đúng hạn</option>
                  <option value="Có tiến bộ vượt bậc so với chính mình">Có tiến bộ vượt bậc so với chính mình</option>
                  <option value="Tích cực phát biểu, hợp tác nhóm tốt">Tích cực phát biểu, hợp tác nhóm tốt</option>
                  <option value="Có tinh thần trách nhiệm cao">Có tinh thần trách nhiệm cao</option>
                  <option value="Giúp đỡ bạn bè trong giờ học">Giúp đỡ bạn bè trong giờ học</option>
                  <option value="Chủ động sửa bài sau góp ý của cô">Chủ động sửa bài sau góp ý của cô</option>
                  <option value="Duy trì nỗ lực học tập xuất sắc">Duy trì nỗ lực học tập xuất sắc</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Huy hiệu trao tặng</label>
                  <select
                    value={rewardBadge}
                    onChange={(e) => setRewardBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="Ngôi sao chăm chỉ">Ngôi sao chăm chỉ</option>
                    <option value="Bước tiến nổi bật">Bước tiến nổi bật</option>
                    <option value="Người bạn hợp tác">Người bạn hợp tác</option>
                    <option value="Tinh thần trách nhiệm">Tinh thần trách nhiệm</option>
                    <option value="Hoàn thành mục tiêu tuần">Hoàn thành mục tiêu tuần</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Xu thưởng</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-pink-600 hover:bg-pink-700 text-white shadow-xs"
                >
                  Cộng Điểm Thưởng Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
