import React, { useState, useMemo } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { ClassTask, Student, StudentTaskRecord, TaskStudentStatus } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import { getAcademicYearInfo, extractUniqueWeeks } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';
import {
  Plus,
  Calendar,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Edit2,
  Users,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Eye,
  Send
} from 'lucide-react';

interface LMSWeeklyAssignmentProps {
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  openCreateModalDirectly?: boolean;
}

export const LMSWeeklyAssignment: React.FC<LMSWeeklyAssignmentProps> = ({
  selectedWeek,
  setSelectedWeek,
  openCreateModalDirectly = false,
}) => {
  const {
    students,
    classTasks,
    addClassTask,
    updateClassTask,
    deleteClassTask,
    updateStudentTaskStatus,
    bulkUpdateStudentTaskStatus,
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<'task_list' | 'create_wizard'>('task_list');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTaskIdForSubmissions, setSelectedTaskIdForSubmissions] = useState<string | null>(null);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>('all');
  const [taskToDelete, setTaskToDelete] = useState<ClassTask | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Inline quick grading state inside submissions modal
  const [gradingStudentId, setGradingStudentId] = useState<string | null>(null);
  const [inputScore, setInputScore] = useState<number | ''>(10);
  const [inputNote, setInputNote] = useState('');

  // Active submission task (reactive with classTasks updates)
  const activeSubmissionTask = useMemo(() => {
    return classTasks.find((t) => t.id === selectedTaskIdForSubmissions) || null;
  }, [classTasks, selectedTaskIdForSubmissions]);

  // Wizard state: 5 steps
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Dynamic Academic Year & Week Calculation from Vietnamese Calendar
  const academicInfo = useMemo(() => getAcademicYearInfo(), []);

  // Dynamically extract unique weeks from classTasks + current week
  const uniqueWeeks = useMemo(() => {
    return extractUniqueWeeks(classTasks, academicInfo.weekLabel);
  }, [classTasks, academicInfo.weekLabel]);

  // Form Fields - Default week automatically sets to calculated current academic week
  const [taskWeek, setTaskWeek] = useState(() => {
    if (selectedWeek && selectedWeek !== 'Tất cả các tuần') {
      return selectedWeek;
    }
    return academicInfo.weekLabel;
  });
  const [taskSubject, setTaskSubject] = useState('Toán');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAttachmentUrl, setTaskAttachmentUrl] = useState('');
  const [taskAttachmentName, setTaskAttachmentName] = useState('');
  const [taskAssignedDate, setTaskAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [taskAssignedToType, setTaskAssignedToType] = useState<'all' | 'group' | 'custom'>('all');
  const [taskAssignedGroup, setTaskAssignedGroup] = useState<string>('Tổ 1');
  const [taskSelectedStudentIds, setTaskSelectedStudentIds] = useState<string[]>([]);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskCriteria, setTaskCriteria] = useState('');
  const [taskRewardCoins, setTaskRewardCoins] = useState(10);
  const [isDraftMode, setIsDraftMode] = useState(false);

  // Editing existing task
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const subjects = [
    { id: 'Toán', name: 'Toán' },
    { id: 'Tiếng Việt', name: 'Tiếng Việt' },
    { id: 'Khoa học', name: 'Khoa học' },
    { id: 'Lịch sử và Địa lí', name: 'Lịch sử và Địa lí' },
    { id: 'Tin học', name: 'Tin học' },
    { id: 'Công nghệ', name: 'Công nghệ' },
    { id: 'Tiếng Anh', name: 'Tiếng Anh' },
    { id: 'Đạo đức', name: 'Đạo đức' },
    { id: 'Hoạt động trải nghiệm', name: 'Hoạt động trải nghiệm' },
    { id: 'Nghệ thuật', name: 'Nghệ thuật (Âm nhạc, Mĩ thuật)' },
    { id: 'Giáo dục thể chất', name: 'Giáo dục thể chất' },
  ];

  // Filter tasks dynamically by selected week
  const weekTasks = useMemo(() => {
    return classTasks.filter((t) => {
      const matchWeek =
        selectedWeek === 'Tất cả các tuần' ||
        (t.week && t.week.trim().toLowerCase() === selectedWeek.trim().toLowerCase());
      const matchSub =
        selectedSubjectFilter === 'all' ||
        t.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();
      return matchWeek && matchSub;
    });
  }, [classTasks, selectedWeek, selectedSubjectFilter]);

  // Reset form
  const handleResetForm = () => {
    setWizardStep(1);
    setTaskWeek(selectedWeek && selectedWeek !== 'Tất cả các tuần' ? selectedWeek : academicInfo.weekLabel);
    setTaskTitle('');
    setTaskDescription('');
    setTaskAttachmentUrl('');
    setTaskAttachmentName('');
    setTaskAssignedToType('all');
    setTaskSelectedStudentIds([]);
    setTaskCriteria('');
    setTaskRewardCoins(10);
    setEditingTaskId(null);
    setIsDraftMode(false);
  };

  // Open Edit Task
  const handleEditTask = (task: ClassTask) => {
    setEditingTaskId(task.id);
    setTaskWeek(task.week || 'Tuần 24');
    setTaskSubject(task.subject);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskAttachmentUrl(task.attachmentUrl || '');
    setTaskAttachmentName(task.attachmentName || '');
    setTaskAssignedDate(task.assignedDate);
    setTaskDueDate(task.dueDate);
    setTaskAssignedToType(task.assignedToType);
    setTaskAssignedGroup(task.assignedGroup || 'Tổ 1');
    setTaskSelectedStudentIds(task.assignedStudentIds || []);
    setTaskPriority(task.priority);
    setTaskCriteria(task.criteria || '');
    setTaskRewardCoins(task.rewardCoins || 10);
    setIsDraftMode(!!task.isDraft);

    setActiveTab('create_wizard');
    setWizardStep(3);
    soundEffects.playClick();
  };

  // Clone from previous week
  const handleCloneTask = (task: ClassTask) => {
    setEditingTaskId(null);
    const targetWeek = selectedWeek && selectedWeek !== 'Tất cả các tuần' ? selectedWeek : academicInfo.weekLabel;
    setTaskWeek(targetWeek);
    setTaskSubject(task.subject);
    setTaskTitle(`${task.title} (Bản sao)`);
    setTaskDescription(task.description);
    setTaskAttachmentUrl(task.attachmentUrl || '');
    setTaskAttachmentName(task.attachmentName || '');
    setTaskAssignedDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setTaskDueDate(d.toISOString().split('T')[0]);
    setTaskAssignedToType(task.assignedToType);
    setTaskAssignedGroup(task.assignedGroup || 'Tổ 1');
    setTaskSelectedStudentIds(task.assignedStudentIds || []);
    setTaskPriority(task.priority);
    setTaskCriteria(task.criteria || '');
    setTaskRewardCoins(task.rewardCoins || 10);

    setActiveTab('create_wizard');
    setWizardStep(3);
    soundEffects.playClick();
  };

  // Toggle close task
  const handleToggleCloseTask = (task: ClassTask) => {
    const updated = { ...task, isClosed: !task.isClosed };
    updateClassTask(updated);
    soundEffects.playCorrect();
  };

  // Step 4: Final Publish / Confirm
  const handleConfirmPublish = (asDraft: boolean = false) => {
    if (!taskTitle.trim()) {
      setTitleError('Vui lòng nhập tên bài tập trước khi xuất bản!');
      setWizardStep(3);
      soundEffects.playWrong();
      return;
    }
    setTitleError(null);
    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);

    // Build initial student records for 42 students
    const initialRecords: Record<string, StudentTaskRecord> = {};
    students.forEach((s) => {
      initialRecords[s.id] = {
        status: 'not_started',
      };
    });

    if (editingTaskId) {
      // Update existing
      const existing = classTasks.find((t) => t.id === editingTaskId);
      if (existing) {
        updateClassTask({
          ...existing,
          title: taskTitle.trim(),
          subject: taskSubject,
          week: taskWeek,
          description: taskDescription.trim() || 'Bài tập rèn luyện cho học sinh Lớp 5.',
          assignedDate: taskAssignedDate,
          dueDate: taskDueDate,
          assignedToType: taskAssignedToType,
          assignedGroup: taskAssignedGroup,
          assignedStudentIds: taskSelectedStudentIds,
          priority: taskPriority,
          criteria: taskCriteria.trim(),
          rewardCoins: Number(taskRewardCoins) || 10,
          attachmentUrl: taskAttachmentUrl.trim(),
          attachmentName: taskAttachmentName.trim(),
          isDraft: asDraft,
        });
      }
    } else {
      // Create new
      addClassTask({
        title: taskTitle.trim(),
        subject: taskSubject,
        week: taskWeek,
        description: taskDescription.trim() || 'Bài tập rèn luyện cho học sinh Lớp 5.',
        assignedDate: taskAssignedDate,
        dueDate: taskDueDate,
        assignedToType: taskAssignedToType,
        assignedGroup: taskAssignedGroup,
        assignedStudentIds: taskSelectedStudentIds,
        priority: taskPriority,
        criteria: taskCriteria.trim(),
        rewardCoins: Number(taskRewardCoins) || 10,
        studentRecords: initialRecords,
        attachmentUrl: taskAttachmentUrl.trim(),
        attachmentName: taskAttachmentName.trim(),
        isDraft: asDraft,
        isClosed: false,
      });
    }

    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    setIsSubmitting(false);
    setSuccessToast(
      asDraft
        ? `Đã lưu bản nháp "${taskTitle}" thành công!`
        : `Đã giao bài tập "${taskTitle}" tới học sinh!`
    );
    setTimeout(() => setSuccessToast(null), 3500);

    handleResetForm();
    setActiveTab('task_list');
  };

  return (
    <div className="space-y-5">
      {/* Success Notification Toast */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-md">
              QUẢN TRỊ BÀI TẬP THEO TUẦN
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-semibold">
              Chương trình Lớp 5
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Giao Bài Tập & Quản Lý Nhiệm Vụ Tuần
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quy trình giao bài 5 bước: chọn tuần, chọn môn, soạn nội dung, xem trước và xác nhận giao.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('task_list')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'task_list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Danh Sách Bài Đã Giao ({weekTasks.length})
          </button>
          <button
            onClick={() => {
              handleResetForm();
              setActiveTab('create_wizard');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'create_wizard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Bài Tập Mới</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 5-STEP CREATE WIZARD */}
      {activeTab === 'create_wizard' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          {/* Step Indicator */}
          <div className="border-b border-slate-100 pb-5">
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-black">
              {[
                { step: 1, label: 'Bước 1', title: 'Chọn Tuần' },
                { step: 2, label: 'Bước 2', title: 'Chọn Môn' },
                { step: 3, label: 'Bước 3', title: 'Nội Dung Bài' },
                { step: 4, label: 'Bước 4', title: 'Xem Lại' },
                { step: 5, label: 'Bước 5', title: 'Hoàn Tất' },
              ].map((item) => (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step < 5) setWizardStep(item.step as any);
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    wizardStep === item.step
                      ? 'bg-blue-600 text-white shadow-xs'
                      : wizardStep > item.step
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider">{item.label}</div>
                  <div className="font-bold text-xs truncate mt-0.5">{item.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: CHỌN TUẦN HỌC */}
          {wizardStep === 1 && (
            <div className="space-y-4 max-w-xl mx-auto py-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Bước 1: Chọn Tuần Học Để Giao Bài
                </h3>
                <p className="text-xs text-slate-500">
                  Chọn tuần học áp dụng bài tập hoặc nhập tuần học mới.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {uniqueWeeks.map((w: string) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setTaskWeek(w);
                      soundEffects.playClick();
                    }}
                    className={`p-4 rounded-2xl border-2 text-left font-bold transition-all ${
                      taskWeek === w
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black">{w}</span>
                      {taskWeek === w && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                      Kỳ I • Năm học 2026 - 2027
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setWizardStep(2);
                    soundEffects.playClick();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <span>Tiếp tục sang Chọn Môn</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN MÔN HỌC */}
          {wizardStep === 2 && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Bước 2: Chọn Môn Học (Chương trình Lớp 5)
                </h3>
                <p className="text-xs text-slate-500">
                  Đang giao bài cho: <strong className="text-blue-600">{taskWeek}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setTaskSubject(sub.id);
                      soundEffects.playClick();
                    }}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      taskSubject === sub.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-black truncate">{sub.name}</div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardStep(3);
                    soundEffects.playClick();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <span>Tiếp tục soạn nội dung bài</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TẠO BÀI TẬP VÀ THÔNG TIN CHI TIẾT */}
          {wizardStep === 3 && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bước 3: Soạn Thảo Chi Tiết Bài Tập
                  </h3>
                  <p className="text-xs text-slate-500">
                    Môn: <strong className="text-blue-600">{taskSubject}</strong> • {taskWeek}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Gợi ý văn phong:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskTitle(`Thử tài khám phá: Ôn tập chuyên đề ${taskSubject}`);
                      setTaskDescription(
                        'Chuyến xe tri thức khởi hành! Các em hãy vận dụng kiến thức bài học để giải quyết các thử thách dưới đây và nộp bài trước thời hạn.'
                      );
                    }}
                    className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold hover:bg-amber-100"
                  >
                    ✨ Vui đến trường
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* Tên bài tập */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên bài tập / Tiêu đề nhiệm vụ <span className="text-rose-500">*</span>
                  </label>
                  {titleError && (
                    <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{titleError}</span>
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => {
                      setTaskTitle(e.target.value);
                      if (titleError) setTitleError(null);
                    }}
                    placeholder="Ví dụ: Phiếu Bài Tập Cuối Tuần 24: Toán Chuyển Động & Số Thập Phân"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Mô tả / Yêu cầu */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mô tả hoặc yêu cầu thực hiện <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Nêu rõ các câu hỏi, yêu cầu cần làm vào vở hoặc ứng dụng..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Tệp đính kèm hoặc link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Đường dẫn tài liệu / Video / Link đính kèm
                    </label>
                    <input
                      type="url"
                      value={taskAttachmentUrl}
                      onChange={(e) => setTaskAttachmentUrl(e.target.value)}
                      placeholder="https://drive.google.com/... hoặc youtube.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tên hiển thị tài liệu
                    </label>
                    <input
                      type="text"
                      value={taskAttachmentName}
                      onChange={(e) => setTaskAttachmentName(e.target.value)}
                      placeholder="Ví dụ: Video bài giảng Google Drive hoặc File đề bài"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Ngày giao & Hạn nộp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày giao bài</label>
                    <input
                      type="date"
                      value={taskAssignedDate}
                      onChange={(e) => setTaskAssignedDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hạn nộp bài <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Đối tượng nhận bài & Phần thưởng Xu */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Đối tượng nhận bài</label>
                    <select
                      value={taskAssignedToType}
                      onChange={(e) => setTaskAssignedToType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="all">Toàn bộ lớp 5B.2 (42 em)</option>
                      <option value="group">Theo tổ học tập</option>
                      <option value="custom">Nhóm học sinh tự chọn</option>
                    </select>
                  </div>

                  {taskAssignedToType === 'group' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chọn Tổ</label>
                      <select
                        value={taskAssignedGroup}
                        onChange={(e) => setTaskAssignedGroup(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Tổ 1">Tổ 1</option>
                        <option value="Tổ 2">Tổ 2</option>
                        <option value="Tổ 3">Tổ 3</option>
                        <option value="Tổ 4">Tổ 4</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ưu tiên</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="low">Bình thường</option>
                      <option value="medium">Quan trọng vừa</option>
                      <option value="high">Bắt buộc / Trọng tâm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phần thưởng (+Xu)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={taskRewardCoins}
                      onChange={(e) => setTaskRewardCoins(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Tiêu chí hoàn thành */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu chí hoàn thành & Cách ghi nhận
                  </label>
                  <input
                    type="text"
                    value={taskCriteria}
                    onChange={(e) => setTaskCriteria(e.target.value)}
                    placeholder="Ví dụ: Đạt từ 8/10 điểm trở lên, trình bày sạch sẽ không tẩy xóa"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Quay lại
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirmPublish(true)}
                    className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Lưu nháp
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirmPublish(false)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Giao bài ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!taskTitle.trim()) {
                        setTitleError('Vui lòng nhập tên bài tập trước khi xem lại!');
                        soundEffects.playWrong();
                        return;
                      }
                      setTitleError(null);
                      setWizardStep(4);
                      soundEffects.playClick();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <span>Xem lại</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: XEM LẠI VÀ XÁC NHẬN GIAO BÀI */}
          {wizardStep === 4 && (
            <div className="space-y-5 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Bước 4: Xem Lại Nội Dung & Xác Nhận Giao Bài
                </h3>
                <p className="text-xs text-slate-500">
                  Kiểm tra kỹ thông tin trước khi phát hành tới học sinh Lớp 5B.2.
                </p>
              </div>

              {/* Preview Card */}
              <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-md">
                    {taskSubject} • {taskWeek}
                  </span>
                  <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-xs font-bold">
                    🪙 Thưởng +{taskRewardCoins} Xu
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900">{taskTitle}</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {taskDescription || 'Không có mô tả chi tiết.'}
                </p>

                {taskAttachmentUrl && (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center space-x-2 text-xs font-bold text-blue-700 truncate">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate">{taskAttachmentName || taskAttachmentUrl}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-blue-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    Ngày giao: <strong>{taskAssignedDate}</strong>
                  </div>
                  <div>
                    Hạn nộp: <strong className="text-rose-600">{taskDueDate}</strong>
                  </div>
                  <div>
                    Đối tượng:{' '}
                    <strong>
                      {taskAssignedToType === 'all'
                        ? 'Toàn bộ 42 học sinh'
                        : taskAssignedToType === 'group'
                        ? taskAssignedGroup
                        : 'Học sinh chỉ định'}
                    </strong>
                  </div>
                  <div>
                    Tiêu chí: <strong>{taskCriteria || 'Theo yêu cầu cần đạt'}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Sửa lại nội dung
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirmPublish(true)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                  >
                    Lưu bản nháp
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirmPublish(false)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5 active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>Xác Nhận Giao Bài Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TASK LIST FOR SELECTED WEEK */}
      {activeTab === 'task_list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Lọc môn học:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả môn học</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Đang hiển thị <strong>{weekTasks.length}</strong> bài tập trong{' '}
              <strong className="text-blue-600">{selectedWeek}</strong>
            </div>
          </div>

          {/* Tasks Grid */}
          {weekTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">
                Chưa có bài tập nào được giao trong {selectedWeek}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bấm vào nút bên dưới để tạo bài tập mới theo quy trình 5 bước chuẩn sư phạm!
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('create_wizard');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Giao bài tập đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekTasks.map((task) => {
                // Compute submitted count
                let completedCount = 0;
                let submittedCount = 0;
                let totalApplicable = 42;

                Object.values(task.studentRecords).forEach((rec) => {
                  if (rec.status === 'completed') completedCount++;
                  else if (rec.status === 'submitted') submittedCount++;
                });

                const percent = Math.round((completedCount / totalApplicable) * 100);

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black px-2.5 py-0.5 rounded-lg">
                          {task.subject}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {task.isClosed && (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-0.5">
                              <Lock className="w-3 h-3" />
                              <span>Đã đóng</span>
                            </span>
                          )}
                          {task.isDraft && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Bản nháp
                            </span>
                          )}
                          <span className="text-amber-600 font-bold text-xs">
                            +{task.rewardCoins} Xu
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {task.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                        <span>Hạn: <strong className="text-slate-800">{task.dueDate}</strong></span>
                        <span>{task.week || 'Tuần 24'}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span>Đã hoàn thành: {completedCount} / 42 em</span>
                          <span className="text-emerald-700">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        onClick={() => {
                          setSelectedTaskIdForSubmissions(task.id);
                          setSubmissionStatusFilter('all');
                          setGradingStudentId(null);
                          soundEffects.playClick();
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chấm & Xem bài ({completedCount}/42)</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCloneTask(task)}
                          title="Sao chép bài sang tuần mới"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditTask(task)}
                          title="Chỉnh sửa bài tập"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleCloseTask(task)}
                          title={task.isClosed ? 'Mở lại bài tập' : 'Đóng / Kết thúc bài tập'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task);
                            soundEffects.playClick();
                          }}
                          title="Xóa bài tập"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Xác Nhận Xóa Bài Tập?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài tập <strong className="text-slate-800">"{taskToDelete.title}"</strong> ({taskToDelete.week || 'Tuần 24'}) không?
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  deleteClassTask(taskToDelete.id);
                  setTaskToDelete(null);
                  soundEffects.playCoin();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Xóa Bài Tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE SUBMISSION & GRADING MODAL FOR A SINGLE TASK */}
      {activeSubmissionTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                    {activeSubmissionTask.subject}
                  </span>
                  <span className="bg-slate-800 text-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                    {activeSubmissionTask.week || 'Tuần 24'}
                  </span>
                  <span className="text-amber-300 text-xs font-bold">
                    Hạn nộp: {activeSubmissionTask.dueDate}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1 truncate">
                  {activeSubmissionTask.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTaskIdForSubmissions(null);
                  setGradingStudentId(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Pills & Bulk Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
                {[
                  { id: 'all', label: `Tất cả (42)` },
                  { id: 'submitted', label: 'Chờ chấm', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { id: 'completed', label: 'Đã hoàn thành', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { id: 'needs_revision', label: 'Cần sửa', color: 'text-orange-700 bg-orange-50 border-orange-200' },
                  { id: 'not_started', label: 'Chưa nộp', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                ].map((f) => {
                  const isAct = submissionStatusFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSubmissionStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                        isAct
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : f.color || 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Bulk Action Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Find all students whose status is submitted
                    const submittedIds = students
                      .filter((s) => {
                        const rec = activeSubmissionTask.studentRecords[s.id];
                        return rec?.status === 'submitted';
                      })
                      .map((s) => s.id);

                    if (submittedIds.length === 0) {
                      soundEffects.playWrong();
                      return;
                    }

                    submittedIds.forEach((sId) => {
                      updateStudentTaskStatus(
                        activeSubmissionTask.id,
                        sId,
                        'completed',
                        'Cô Kim Tiến: Đã chấm đạt yêu cầu!',
                        10
                      );
                    });

                    soundEffects.playCorrect();
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chấm đạt tất cả bài chờ chấm (10đ)</span>
                </button>
              </div>
            </div>

            {/* List of 42 students for this task */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5">
              {students
                .filter((student) => {
                  const rec = activeSubmissionTask.studentRecords[student.id];
                  const status = rec?.status || 'not_started';
                  if (submissionStatusFilter === 'all') return true;
                  return status === submissionStatusFilter;
                })
                .map((student, idx) => {
                  const rec = activeSubmissionTask.studentRecords[student.id];
                  const status = rec?.status || 'not_started';
                  const isGradingThis = gradingStudentId === student.id;

                  const getStatusLabel = () => {
                    if (status === 'completed') {
                      return (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã hoàn thành {rec?.score !== undefined ? `(${rec.score}đ)` : ''}</span>
                        </span>
                      );
                    }
                    if (status === 'submitted') {
                      return (
                        <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-lg border border-amber-200 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Đã nộp • Chờ chấm</span>
                        </span>
                      );
                    }
                    if (status === 'needs_revision') {
                      return (
                        <span className="bg-orange-100 text-orange-800 text-xs font-black px-2.5 py-1 rounded-lg border border-orange-200 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                          <span>Cần sửa lại</span>
                        </span>
                      );
                    }
                    if (status === 'late') {
                      return (
                        <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-lg border border-rose-200">
                          Nộp trễ
                        </span>
                      );
                    }
                    return (
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg">
                        Chưa nộp
                      </span>
                    );
                  };

                  return (
                    <div
                      key={student.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Student Identity */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-slate-400 font-bold w-5 text-center">{idx + 1}</span>
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-9 h-9 rounded-xl border border-slate-200 bg-white object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate text-sm">
                            {student.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {student.group || 'Tổ 1'} • 🪙 {student.coins} Xu
                            {rec?.note && (
                              <span className="ml-2 text-amber-700 italic truncate">
                                "{rec.note}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge & Quick Action Buttons */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-2 justify-end">
                        {getStatusLabel()}

                        {/* Quick Action: Mark Completed 10đ */}
                        <button
                          onClick={() => {
                            updateStudentTaskStatus(
                              activeSubmissionTask.id,
                              student.id,
                              'completed',
                              'Cô Kim Tiến đã chấm: Đạt yêu cầu tốt!',
                              10
                            );
                            soundEffects.playCorrect();
                            confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
                          }}
                          title="Chấm hoàn thành 10 điểm và thưởng xu"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-lg font-bold border border-emerald-200 transition-colors"
                        >
                          ✅ Đạt 10đ
                        </button>

                        {/* Quick Action: Needs Revision */}
                        <button
                          onClick={() => {
                            updateStudentTaskStatus(
                              activeSubmissionTask.id,
                              student.id,
                              'needs_revision',
                              'Em cần xem lại và sửa các lỗi đã chỉ dẫn.'
                            );
                            soundEffects.playCoin();
                          }}
                          title="Yêu cầu học sinh chỉnh sửa bài"
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-600 text-orange-800 hover:text-white rounded-lg font-bold border border-orange-200 transition-colors"
                        >
                          🔄 Cần sửa
                        </button>

                        {/* Quick Action: Mark Submitted */}
                        <button
                          onClick={() => {
                            updateStudentTaskStatus(activeSubmissionTask.id, student.id, 'submitted');
                            soundEffects.playCoin();
                          }}
                          title="Đánh dấu học sinh đã nộp bài"
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white rounded-lg font-bold border border-amber-200 transition-colors"
                        >
                          ⏱️ Đã nộp
                        </button>

                        {/* Toggle Inline Editor for Custom Score and Feedback Note */}
                        <button
                          onClick={() => {
                            if (isGradingThis) {
                              setGradingStudentId(null);
                            } else {
                              setGradingStudentId(student.id);
                              setInputScore(rec?.score !== undefined ? rec.score : 10);
                              setInputNote(rec?.note || '');
                            }
                            soundEffects.playClick();
                          }}
                          title="Nhập điểm số hoặc lời phê chi tiết"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-lg font-bold transition-colors flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </div>

                      {/* Inline Detail Grading Box */}
                      {isGradingThis && (
                        <div className="w-full mt-2 p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <span className="font-bold text-slate-700 text-xs">Điểm số:</span>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={inputScore}
                              onChange={(e) => setInputScore(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="10"
                              className="w-16 p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-center text-xs"
                            />
                            <span className="text-slate-500 text-xs">/10</span>
                          </div>

                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              value={inputNote}
                              onChange={(e) => setInputNote(e.target.value)}
                              placeholder="Lời phê của cô Kim Tiến: (Ví dụ: Chữ viết đẹp, tính toán chuẩn xác)..."
                              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => setGradingStudentId(null)}
                              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Đóng
                            </button>
                            <button
                              onClick={() => {
                                const num = inputScore !== '' ? Number(inputScore) : undefined;
                                updateStudentTaskStatus(
                                  activeSubmissionTask.id,
                                  student.id,
                                  num !== undefined && num >= 5 ? 'completed' : status,
                                  inputNote.trim() || undefined,
                                  num
                                );
                                soundEffects.playCorrect();
                                setGradingStudentId(null);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                            >
                              Lưu điểm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
