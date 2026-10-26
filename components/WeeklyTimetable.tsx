import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { TimetableSubjectConfig, TimetableSlot, TimetableSubjectId } from '../types';
import {
  Calendar,
  Clock,
  BookOpen,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  Printer,
  Download,
  Info,
  Layers,
  Eye,
  EyeOff,
  Edit3,
  X,
  Plus,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { TimeTableManager } from './TimeTableManager';

interface WeeklyTimetableProps {
  embeddedInParent?: boolean;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({ embeddedInParent = false }) => {
  const {
    timetableSubjects,
    timetableSlots,
    timetableSettings,
    updateTimetableSettings,
    toggleSubjectVisibility,
    setOnlyCoreSubjects,
    updateTimetableSlot,
    resetTimetable,
    isTeacherLoggedIn,
  } = useClassroom();

  // Active view filters
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all'); // 'all' or 2..6
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showTimeTableManager, setShowTimeTableManager] = useState(false);
  const [isExtendedExpanded, setIsExtendedExpanded] = useState(false);
  const [searchSubject, setSearchSubject] = useState('');

  // Slot editing modal
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editSubjectId, setEditSubjectId] = useState<TimetableSubjectId>('toan');
  const [editTeacher, setEditTeacher] = useState('');
  const [editRoom, setEditRoom] = useState('');

  // Weekly notes editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(timetableSettings.weeklyNotes);

  const coreSubjects = timetableSubjects.filter((s) => s.isCore);
  const extendedSubjects = timetableSubjects.filter((s) => !s.isCore);

  // Check if a subject is currently enabled in settings
  const isSubjectVisible = (subjectId: TimetableSubjectId) => {
    return timetableSettings.visibleSubjectIds.includes(subjectId);
  };

  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setEditLessonTitle(slot.lessonTitle || '');
    setEditNote(slot.note || '');
    setEditSubjectId(slot.subjectId);
    setEditTeacher(slot.teacher || '');
    setEditRoom(slot.room || '');
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const targetSub = timetableSubjects.find((s) => s.id === editSubjectId);
    const updated: TimetableSlot = {
      ...editingSlot,
      subjectId: editSubjectId,
      subjectName: targetSub ? targetSub.name : editingSlot.subjectName,
      lessonTitle: editLessonTitle.trim(),
      note: editNote.trim(),
      teacher: editTeacher.trim() || targetSub?.defaultTeacher,
      room: editRoom.trim() || targetSub?.room,
    };

    updateTimetableSlot(updated);
    setEditingSlot(null);
  };

  const handleSaveNotes = () => {
    updateTimetableSettings({ weeklyNotes: notesDraft.trim() });
    setIsEditingNotes(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const daysList = [
    { num: 2, label: 'Thứ Hai', short: 'T2' },
    { num: 3, label: 'Thứ Ba', short: 'T3' },
    { num: 4, label: 'Thứ Tư', short: 'T4' },
    { num: 5, label: 'Thứ Năm', short: 'T5' },
    { num: 6, label: 'Thứ Sáu', short: 'T6' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1.5">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-1 rounded-xl flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kế Hoạch Học Tập Tuần</span>
              </span>
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-xl">
                {timetableSettings.weekTitle}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-xl">
                {timetableSettings.classTitle}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-2">
              Thời Khóa Biểu Hàng Tuần
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              GVCN: <span className="font-bold text-slate-700">{timetableSettings.homeroomTeacher}</span> • Bố trí 2 chỗ ngồi mỗi bàn học • Cấu hình đầy đủ 12 môn học & hoạt động
            </p>
          </div>

          {/* Quick Actions & Admin Toggle */}
          <div className="flex items-center space-x-2 flex-wrap gap-2 w-full lg:w-auto">
            <button
              onClick={() => {
                setShowTimeTableManager(!showTimeTableManager);
                if (showAdminPanel) setShowAdminPanel(false);
              }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all ${
                showTimeTableManager
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{showTimeTableManager ? 'Đóng Tải File TKB' : '📁 Tải File TKB / Cập Nhật 2018'}</span>
            </button>

            <button
              onClick={() => {
                setShowAdminPanel(!showAdminPanel);
                if (showTimeTableManager) setShowTimeTableManager(false);
              }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all ${
                showAdminPanel
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{showAdminPanel ? 'Đóng Công Cụ Admin' : 'Quản Trị Môn Học (Admin)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors border border-slate-200"
              title="In bản kế hoạch tuần"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">In Thời Khóa Biểu</span>
            </button>
          </div>
        </div>

        {/* TIME TABLE MANAGER (UPLOAD & PRESET) */}
        {showTimeTableManager && (
          <div className="mt-5 animate-in fade-in duration-200">
            <TimeTableManager onSuccess={() => setShowTimeTableManager(false)} />
          </div>
        )}

        {/* Visibility Filter Summary Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
            <span className="font-bold text-slate-600">Trạng thái hiển thị:</span>
            {timetableSettings.showOnlyCore ? (
              <span className="bg-amber-100 text-amber-900 font-black px-2.5 py-1 rounded-lg flex items-center space-x-1">
                <span>🎯 Ưu tiên 5 môn chủ yếu</span>
                <span className="text-amber-700 font-normal">(7 môn phụ đang thu gọn)</span>
              </span>
            ) : (
              <span className="bg-indigo-100 text-indigo-900 font-black px-2.5 py-1 rounded-lg flex items-center space-x-1">
                <span>🌈 Tùy biến hiển thị ({timetableSettings.visibleSubjectIds.length}/12 môn)</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setOnlyCoreSubjects(true)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timetableSettings.showOnlyCore
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chỉ hiện 5 môn chủ yếu
            </button>
            <button
              onClick={() => setOnlyCoreSubjects(false)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                !timetableSettings.showOnlyCore && timetableSettings.visibleSubjectIds.length === 12
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hiện tất cả 12 môn
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN CONTROL PANEL (CÔNG CỤ QUẢN TRỊ ADMIN) */}
      {showAdminPanel && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-indigo-800/60 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-indigo-800/80">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  Bảng Quản Trị Admin
                </span>
                <span className="text-xs text-indigo-300 font-semibold">
                  Cô Kim Tiến Number Hi!
                </span>
              </div>
              <h3 className="text-xl font-black mt-1 text-white">
                Bộ Công Cụ Tùy Chỉnh Thời Khóa Biểu & Môn Học
              </h3>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                Chủ động bật/tắt hộp kiểm để quyết định môn nào hiển thị ngay, môn nào thu gọn vào danh sách mở rộng.
              </p>
            </div>

            <button
              onClick={() => setShowAdminPanel(false)}
              className="text-indigo-300 hover:text-white p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center justify-between flex-wrap gap-2 py-4">
            <span className="text-xs font-bold text-indigo-200">Thao tác nhanh:</span>
            <div className="flex items-center space-x-2 flex-wrap gap-1.5">
              <button
                onClick={() => setOnlyCoreSubjects(true)}
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1"
              >
                <span>🎯 Mặc Định: 5 Môn Chủ Yếu</span>
              </button>
              <button
                onClick={() => setOnlyCoreSubjects(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
              >
                <span>🌟 Mở Toàn Bộ 12 Môn</span>
              </button>
              <button
                onClick={resetTimetable}
                className="bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi Phục Mặc Định</span>
              </button>
            </div>
          </div>

          {/* SECTION A: 5 MÔN CHỦ YẾU (ƯU TIÊN HIỂN THỊ) */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  1. Nhóm 5 Môn Học Chủ Yếu (Ưu tiên hiển thị mặc định)
                </h4>
              </div>
              <p className="text-xs text-indigo-300 mt-0.5">
                Toán, Tiếng Việt, Tiếng Anh, Khoa học, Lịch sử - Địa lí luôn xuất hiện rõ ràng trên giao diện báo cáo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {coreSubjects.map((sub) => {
                const active = isSubjectVisible(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      active
                        ? 'bg-indigo-900/70 border-amber-400/70 text-white shadow-xs'
                        : 'bg-white/5 border-white/10 text-indigo-300 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSubjectVisibility(sub.id)}
                      className="mt-1 w-4 h-4 rounded border-indigo-400 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm flex items-center space-x-1.5">
                          <span>{sub.icon}</span>
                          <span>{sub.name}</span>
                        </span>
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                          Chủ yếu
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200 mt-1 line-clamp-1">
                        {sub.description}
                      </p>
                      <div className="text-[10px] text-indigo-400 mt-1">
                        GV: {sub.defaultTeacher}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION B: 7 MÔN HỌC & HOẠT ĐỘNG CÒN LẠI (THU GỌN - ADMIN TÙY CHỌN MỞ RỘNG) */}
          <div className="space-y-4 pt-6 border-t border-indigo-800/60 mt-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wide">
                  2. Nhóm 7 Môn Học & Hoạt Động Bổ Trợ (Thu gọn mặc định)
                </h4>
              </div>
              <p className="text-xs text-indigo-300 mt-0.5">
                Các môn học và hoạt động này được ẩn bớt để giao diện không bị rối. Admin có thể tích chọn mở hiển thị thêm khi cần thiết!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {extendedSubjects.map((sub) => {
                const active = isSubjectVisible(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      active
                        ? 'bg-indigo-900/70 border-cyan-400/70 text-white shadow-xs'
                        : 'bg-white/5 border-white/10 text-indigo-300 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSubjectVisibility(sub.id)}
                      className="mt-1 w-4 h-4 rounded border-indigo-400 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm flex items-center space-x-1.5">
                          <span>{sub.icon}</span>
                          <span>{sub.name}</span>
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          active ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-400'
                        }`}>
                          {active ? 'Đã bật' : 'Thu gọn'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200 mt-1 line-clamp-1">
                        {sub.description}
                      </p>
                      <div className="text-[10px] text-indigo-400 mt-1">
                        GV: {sub.defaultTeacher}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED COLLAPSIBLE BAR FOR EXTENDED SUBJECTS (DÀNH CHO PHỤ HUYNH & HỌC SINH) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">
                Môn học & Hoạt động trong tuần ({timetableSubjects.length} môn cấu hình)
              </h4>
              <p className="text-xs text-slate-500">
                {timetableSettings.showOnlyCore
                  ? 'Đang ưu tiên hiển thị 5 môn chủ yếu. Bấm mở rộng để xem 7 môn và hoạt động bổ trợ.'
                  : `Đang mở hiển thị ${timetableSettings.visibleSubjectIds.length} môn học.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExtendedExpanded(!isExtendedExpanded)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            {isExtendedExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-600" />
                <span>Thu gọn 7 môn & hoạt động bổ trợ</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-600" />
                <span>Xem thêm 7 môn & hoạt động khác (+7)</span>
              </>
            )}
          </button>
        </div>

        {/* Core subjects pills preview */}
        <div className="flex items-center space-x-2 flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            5 Môn chủ yếu:
          </span>
          {coreSubjects.map((sub) => (
            <span
              key={sub.id}
              className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center space-x-1.5 ${sub.badgeBg} ${sub.badgeText} border ${sub.borderCol}`}
            >
              <span>{sub.icon}</span>
              <span>{sub.name}</span>
            </span>
          ))}
        </div>

        {/* Collapsible expanded drawer for the 7 extended subjects */}
        {isExtendedExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                7 Môn học và Hoạt động bổ trợ (Đã cấu hình trong hệ thống):
              </span>
              <span className="text-xs text-indigo-600 font-bold">
                Bấm vào môn để xem chi tiết hoặc cấu hình
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {extendedSubjects.map((sub) => {
                const active = isSubjectVisible(sub.id);
                return (
                  <div
                    key={sub.id}
                    className={`rounded-2xl p-3 border transition-all ${
                      active
                        ? 'bg-slate-50 border-indigo-200'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-800 flex items-center space-x-1">
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {active ? 'Hiển thị' : 'Đang thu gọn'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {sub.description}
                    </p>
                    <div className="text-[10px] font-semibold text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>{sub.defaultTeacher}</span>
                      <span>{sub.room}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DAY SELECTOR TABS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
            selectedDay === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          📅 Toàn Tuần (Thứ 2 - Thứ 6)
        </button>

        {daysList.map((d) => (
          <button
            key={d.num}
            onClick={() => setSelectedDay(d.num)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedDay === d.num
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* WEEKLY TIMETABLE MATRIX TABLE (GIAO DIỆN BẢNG CHÍNH) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Morning Session (Buổi Sáng) */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
              ☀️ Buổi Sáng (Tiết 1 đến Tiết 4 • 07:30 - 10:35)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {daysList
              .filter((d) => selectedDay === 'all' || selectedDay === d.num)
              .map((day) => {
                const daySlots = timetableSlots
                  .filter((s) => s.dayOfWeek === day.num && s.session === 'morning')
                  .sort((a, b) => a.period - b.period);

                return (
                  <div
                    key={day.num}
                    className="bg-slate-50/70 rounded-2xl p-3 border border-slate-200 flex flex-col space-y-2.5"
                  >
                    <div className="bg-indigo-600 text-white rounded-xl py-1.5 px-2.5 text-center shadow-xs">
                      <span className="text-xs font-black uppercase tracking-wider">
                        {day.label}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {daySlots.map((slot) => {
                        const subjectConfig = timetableSubjects.find((s) => s.id === slot.subjectId);
                        const isCore = subjectConfig?.isCore ?? false;
                        const isVisible = isSubjectVisible(slot.subjectId);

                        // If user requested only core and this subject is hidden:
                        // We render a neat collapsed placeholder to avoid clutter!
                        if (!isVisible) {
                          return (
                            <div
                              key={slot.id}
                              onClick={() => handleOpenEditSlot(slot)}
                              className="bg-slate-100 hover:bg-slate-200/80 rounded-xl p-2 border border-dashed border-slate-300 transition-colors cursor-pointer group"
                              title={`Tiết ${slot.period}: ${slot.subjectName} (Bấm để xem hoặc chỉnh sửa)`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Tiết {slot.period} • {slot.timeRange}</span>
                                <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.2 rounded">
                                  Thu gọn
                                </span>
                              </div>
                              <div className="text-xs font-bold text-slate-600 mt-0.5 truncate flex items-center space-x-1">
                                <span>{subjectConfig?.icon || '📘'}</span>
                                <span className="group-hover:text-indigo-600">{slot.subjectName}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={slot.id}
                            onClick={() => handleOpenEditSlot(slot)}
                            className={`rounded-2xl p-2.5 border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                              isCore
                                ? 'bg-white border-amber-300/80 ring-1 ring-amber-200/50'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>Tiết {slot.period} ({slot.timeRange})</span>
                              {isCore ? (
                                <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black text-[9px]">
                                  Chủ yếu
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                                  {subjectConfig?.shortName}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span className="text-base">{subjectConfig?.icon}</span>
                              <span className="font-black text-xs text-slate-800 truncate">
                                {slot.subjectName}
                              </span>
                            </div>

                            {slot.lessonTitle && (
                              <p className="text-[11px] font-semibold text-slate-600 mt-1 line-clamp-2 leading-tight">
                                {slot.lessonTitle}
                              </p>
                            )}

                            {slot.note && (
                              <div className="mt-1.5 pt-1 border-t border-slate-100 text-[10px] text-indigo-600 font-medium line-clamp-1 flex items-center space-x-1">
                                <Info className="w-3 h-3 shrink-0" />
                                <span>{slot.note}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Afternoon Session (Buổi Chiều) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
              🌤️ Buổi Chiều (Tiết 1 đến Tiết 3 • 14:00 - 16:05)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {daysList
              .filter((d) => selectedDay === 'all' || selectedDay === d.num)
              .map((day) => {
                const daySlots = timetableSlots
                  .filter((s) => s.dayOfWeek === day.num && s.session === 'afternoon')
                  .sort((a, b) => a.period - b.period);

                return (
                  <div
                    key={day.num}
                    className="bg-slate-50/70 rounded-2xl p-3 border border-slate-200 flex flex-col space-y-2.5"
                  >
                    <div className="bg-slate-700 text-white rounded-xl py-1 px-2 text-center text-xs font-bold">
                      Chiều • {day.label}
                    </div>

                    <div className="space-y-2 flex-1">
                      {daySlots.map((slot) => {
                        const subjectConfig = timetableSubjects.find((s) => s.id === slot.subjectId);
                        const isCore = subjectConfig?.isCore ?? false;
                        const isVisible = isSubjectVisible(slot.subjectId);

                        if (!isVisible) {
                          return (
                            <div
                              key={slot.id}
                              onClick={() => handleOpenEditSlot(slot)}
                              className="bg-slate-100 hover:bg-slate-200/80 rounded-xl p-2 border border-dashed border-slate-300 transition-colors cursor-pointer group"
                              title={`Tiết ${slot.period}: ${slot.subjectName} (Bấm để xem hoặc chỉnh sửa)`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Tiết {slot.period} • {slot.timeRange}</span>
                                <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.2 rounded">
                                  Thu gọn
                                </span>
                              </div>
                              <div className="text-xs font-bold text-slate-600 mt-0.5 truncate flex items-center space-x-1">
                                <span>{subjectConfig?.icon || '📘'}</span>
                                <span className="group-hover:text-indigo-600">{slot.subjectName}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={slot.id}
                            onClick={() => handleOpenEditSlot(slot)}
                            className={`rounded-2xl p-2.5 border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                              isCore
                                ? 'bg-white border-amber-300/80 ring-1 ring-amber-200/50'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>Tiết {slot.period} ({slot.timeRange})</span>
                              {isCore ? (
                                <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black text-[9px]">
                                  Chủ yếu
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                                  {subjectConfig?.shortName}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span className="text-base">{subjectConfig?.icon}</span>
                              <span className="font-black text-xs text-slate-800 truncate">
                                {slot.subjectName}
                              </span>
                            </div>

                            {slot.lessonTitle && (
                              <p className="text-[11px] font-semibold text-slate-600 mt-1 line-clamp-2 leading-tight">
                                {slot.lessonTitle}
                              </p>
                            )}

                            {slot.note && (
                              <div className="mt-1.5 pt-1 border-t border-slate-100 text-[10px] text-indigo-600 font-medium line-clamp-1 flex items-center space-x-1">
                                <Info className="w-3 h-3 shrink-0" />
                                <span>{slot.note}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Weekly Reminder & Parent Notice Card */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-4 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <span className="text-2xl mt-0.5">📢</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 block">
                Lời Dặn Dò & Kế Hoạch Học Tập Tuần Này (Cô Kim Tiến Number Hi!)
              </span>
              {isEditingNotes ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveNotes}
                      className="bg-amber-600 text-white font-bold text-xs px-3 py-1 rounded-lg"
                    >
                      Lưu lời dặn
                    </button>
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-medium text-amber-900 mt-0.5">
                  {timetableSettings.weeklyNotes}
                </p>
              )}
            </div>
          </div>

          {!isEditingNotes && (
            <button
              onClick={() => {
                setNotesDraft(timetableSettings.weeklyNotes);
                setIsEditingNotes(true);
              }}
              className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center space-x-1 shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/60 hover:bg-amber-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa dặn dò</span>
            </button>
          )}
        </div>
      </div>

      {/* EDIT SLOT MODAL (CHO PHÉP ADMIN / GIÁO VIÊN CHỈNH SỬA TỪNG TIẾT) */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-indigo-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-200">
                  Thứ {editingSlot.dayOfWeek} • {editingSlot.session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'} • Tiết {editingSlot.period}
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  Chỉnh Sửa Tiết Học: {editingSlot.subjectName}
                </h3>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Môn Học ({timetableSubjects.length} môn đã cấu hình):
                </label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value as TimetableSubjectId)}
                  className="w-full text-xs sm:text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <optgroup label="5 Môn học chủ yếu (Ưu tiên)">
                    {coreSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name} (Chủ yếu)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="7 Môn & Hoạt động còn lại (Thu gọn)">
                    {extendedSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Bài Học / Nội Dung Trọng Tâm:
                </label>
                <input
                  type="text"
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập toán chuyển động đều..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời Dặn Dò / Chuẩn Bị Đồ Dùng (Hiện cho phụ huynh & học sinh):
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ví dụ: Mang sách giáo khoa Toán 5 tập 1 và thước kẻ..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo Viên Giảng Dạy:
                  </label>
                  <input
                    type="text"
                    value={editTeacher}
                    onChange={(e) => setEditTeacher(e.target.value)}
                    placeholder="Cô Kim Tiến Number Hi!"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phòng Học:
                  </label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    placeholder="Phòng học 5B.2"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
