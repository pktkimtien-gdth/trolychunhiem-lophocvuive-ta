import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Student, DeskPosition } from '../types';
import { INITIAL_DESKS } from '../data/initialData';
import { getStudentNeutralAvatar } from '../utils/studentAvatar';
import { StudentListImportModal } from './StudentListImportModal';
import { AchievementBadge } from './AchievementBadge';
import {
  Sparkles,
  Award,
  Plus,
  Coins,
  ArrowRightLeft,
  Check,
  UserCheck,
  Smile,
  ShieldCheck,
  Info,
  UploadCloud,
  FileSpreadsheet,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects';

interface SeatingChartProps {
  onSelectStudent: (student: Student) => void;
}

export const SeatingChart: React.FC<SeatingChartProps> = ({ onSelectStudent }) => {
  const {
    students,
    desks,
    awardCoins,
    updateDeskStudent,
    swapDeskStudents,
    currentStudent,
    role,
    isTeacherLoggedIn,
  } = useClassroom();

  const [selectedDesk, setSelectedDesk] = useState<DeskPosition | null>(null);
  const [isSwapping, setIsSwapping] = useState<string | null>(null); // DeskId being moved via click
  const [draggedDeskId, setDraggedDeskId] = useState<string | null>(null); // DeskId being dragged
  const [dragOverDeskId, setDragOverDeskId] = useState<string | null>(null); // DeskId hover target
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [awardNotification, setAwardNotification] = useState<{
    deskId: string;
    text: string;
  } | null>(null);

  const getStudentForDesk = (desk?: DeskPosition): Student | undefined => {
    if (!desk || !desk.studentId) return undefined;
    return (students || []).find((s) => s && s.id === desk.studentId);
  };

  const [soundOn, setSoundOn] = useState(() => soundEffects.isEnabled());

  const handleToggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundOn(newState);
  };

  const handleQuickAward = (e: React.MouseEvent, studentId: string, deskId: string, amount: number) => {
    e.stopPropagation();
    awardCoins(studentId, amount, 'Thưởng tại chỗ trên sơ đồ lớp');
    if (amount >= 5) {
      soundEffects.playBigCoin();
    } else {
      soundEffects.playCoin();
    }
    setAwardNotification({ deskId, text: `+${amount} Xu!` });
    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.7 },
    });
    setTimeout(() => {
      setAwardNotification(null);
    }, 1500);
  };

  /* ========================================================
   * XỬ LÝ KÉO THẢ (DRAG & DROP) VÀ LƯU VỊ TRÍ CHỖ NGỒI SƠ ĐỒ LỚP
   * - Giáo viên kéo thả thẻ học sinh sang bàn mới
   * - Hoán đổi nguyên tử (atomic swap) 2 vị trí và tự động lưu vào LocalStorage
   * - Hiển thị Toast thông báo xác nhận đã lưu thành công
   * ======================================================== */
  const handleDragStart = (e: React.DragEvent, deskId: string) => {
    if (!isTeacherLoggedIn) return;
    setDraggedDeskId(deskId);
    e.dataTransfer.setData('text/plain', deskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, deskId: string) => {
    if (!isTeacherLoggedIn || !draggedDeskId || draggedDeskId === deskId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDeskId !== deskId) {
      setDragOverDeskId(deskId);
    }
  };

  const handleDragLeave = (deskId: string) => {
    if (dragOverDeskId === deskId) {
      setDragOverDeskId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDeskId: string) => {
    e.preventDefault();
    const sourceDeskId = draggedDeskId || e.dataTransfer.getData('text/plain');
    setDraggedDeskId(null);
    setDragOverDeskId(null);

    if (!sourceDeskId || sourceDeskId === targetDeskId) return;

    // Hoán đổi nguyên tử và tự động lưu trạng thái vào LocalStorage
    swapDeskStudents(sourceDeskId, targetDeskId);

    // Kích hoạt âm thanh và hiển thị thông báo Toast
    soundEffects.playCorrect();
    setSaveToast('Đã lưu sơ đồ lớp học thành công!');
    setTimeout(() => {
      setSaveToast(null);
    }, 2500);
  };

  const handleDeskClick = (desk: DeskPosition) => {
    if (isSwapping) {
      if (isSwapping !== desk.id) {
        // Hoán đổi 2 bàn và lưu trạng thái
        swapDeskStudents(isSwapping, desk.id);
        soundEffects.playCorrect();
        setSaveToast('Đã lưu sơ đồ lớp học thành công!');
        setTimeout(() => setSaveToast(null), 2500);
      }
      setIsSwapping(null);
      return;
    }

    // Đối với học sinh và phụ huynh: chỉ được xem chi tiết chỗ của bản thân / con mình
    if (role === 'student' || role === 'parent') {
      const student = getStudentForDesk(desk);
      if (currentStudent && student?.id === currentStudent.id) {
        setSelectedDesk(desk);
      }
      return;
    }

    setSelectedDesk(desk);
  };

  // Defensive sanitization: ensure desks and students arrays are robust against corrupted localStorage state
  const safeDesks = Array.isArray(desks) && desks.length > 0 ? desks : INITIAL_DESKS;
  const safeStudents = Array.isArray(students) ? students : [];

  // Group desks by dynamic rows (supports 42+ students, safely guards against NaN/invalid array length)
  const validRows = safeDesks.map((d) => (d && typeof d.row === 'number' && Number.isFinite(d.row) ? d.row : 1));
  const rawMaxRow = validRows.length > 0 ? Math.max(1, ...validRows) : 6;
  const safeMaxRow = Math.min(12, Math.max(1, Number.isFinite(rawMaxRow) ? rawMaxRow : 6));
  const rows = Array.from({ length: safeMaxRow }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header info */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Sơ đồ Lớp học 5B.2
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>{safeStudents.length} Học sinh</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Bố trí vị trí chỗ ngồi trực quan cho Lớp 5B.2 Vui Vẻ • GVCN: Cô Kim Tiến Number Hi!
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button
              onClick={handleToggleSound}
              className={`px-3 py-2.5 rounded-2xl border font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs ${
                soundOn
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundOn ? 'Âm thanh: Đang BẬT (Bấm để tắt)' : 'Âm thanh: Đang TẮT (Bấm để bật)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundOn ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
            </button>

            {(isTeacherLoggedIn || role === 'admin') && (
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                title="Dành cho Giáo viên: Nhập danh sách học sinh từ file Excel (.xlsx)"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Thêm File Danh Sách HS</span>
              </button>
            )}

            {isSwapping ? (
              <button
                onClick={() => setIsSwapping(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition-all animate-pulse cursor-pointer"
              >
                Hủy chuyển chỗ
              </button>
            ) : (isTeacherLoggedIn || role === 'admin') ? (
              <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-2xl flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Bấm vào bàn học để tặng xu thưởng hoặc đổi chỗ ngồi</span>
              </div>
            ) : role === 'student' ? (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-2 rounded-2xl flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chạm vào chỗ ngồi của em để xem chi tiết sao thưởng và bài học</span>
              </div>
            ) : role === 'parent' ? (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-2 rounded-2xl flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sơ đồ vị trí chỗ ngồi của học sinh trong Lớp 5B.2</span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-2xl flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Sơ đồ Lớp học 5B.2 • Năm học 2026 - 2027</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Container */}
      <div className="bg-gradient-to-b from-slate-100/90 to-slate-200/60 rounded-3xl p-4 sm:p-8 border-2 border-slate-200/90 shadow-inner">
        {/* The Famous Classroom Chalkboard Header (As in Screenshot 1) */}
        <div className="max-w-3xl mx-auto mb-6 bg-gradient-to-b from-[#16382b] to-[#0f281e] rounded-2xl p-4 sm:p-5 text-white border-4 border-[#2b5945] shadow-xl text-center relative overflow-hidden">
          {/* Subtle chalk board line pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Slogans on chalkboard */}
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-emerald-200 tracking-widest uppercase mb-1">
            <span className="flex items-center space-x-1">
              <span className="text-amber-400">✦</span>
              <span>KỶ LUẬT • TRI THỨC</span>
              <span className="text-amber-400">✦</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-amber-400">✦</span>
              <span>SÁNG TẠO</span>
              <span className="text-amber-400">✦</span>
            </span>
          </div>

          {/* Main Class Title */}
          <div className="flex items-center justify-center space-x-2 text-xl sm:text-2xl font-black text-amber-300 drop-shadow-md">
            <span>✨ ★</span>
            <span className="tracking-wide text-white uppercase font-black">
              BẢNG LỚP 5B.2 VUI VẺ
            </span>
            <span>★ ✨</span>
          </div>

          {/* Teacher and Class details */}
          <div className="mt-1 text-xs text-emerald-100/90 font-medium flex items-center justify-center space-x-2 flex-wrap">
            <span>Năm học: 2026 - 2027</span>
            <span>•</span>
            <span className="font-bold text-amber-200">GVCN: Cô Kim Tiến Number Hi!</span>
            <span>•</span>
            <span>Sĩ số: {safeStudents.length} học sinh</span>
          </div>
        </div>

        {/* Teacher's Desk (Bàn Giáo Viên) */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-100 via-indigo-100 to-purple-100 border-2 border-purple-300/80 rounded-2xl px-6 py-2.5 shadow-md flex items-center space-x-2.5 text-purple-900">
            <span className="text-lg">💻</span>
            <div className="text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider block text-purple-700">
                Bàn Giáo Viên ☀️
              </span>
              <span className="text-sm font-black text-purple-950">
                Cô Kim Tiến Number Hi! (Chủ nhiệm 5B.2)
              </span>
            </div>
          </div>
        </div>

        {/* Column Headers (Bố trí 4 Dãy: Mỗi dãy 1 bàn mỗi hàng, mỗi bàn gồm 2 chỗ ngồi) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 text-white rounded-2xl py-2 px-3 text-center shadow-md border-b-2 border-indigo-900">
            <div className="text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1">
              <span>📍 DÃY 1 (TỔ 1)</span>
            </div>
            <div className="text-[10px] text-blue-100 font-semibold mt-0.5">
              1 bàn/hàng • 2 chỗ ngồi
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 text-white rounded-2xl py-2 px-3 text-center shadow-md border-b-2 border-purple-900">
            <div className="text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1">
              <span>📍 DÃY 2 (TỔ 2)</span>
            </div>
            <div className="text-[10px] text-purple-100 font-semibold mt-0.5">
              1 bàn/hàng • 2 chỗ ngồi
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-pink-700 text-white rounded-2xl py-2 px-3 text-center shadow-md border-b-2 border-pink-900">
            <div className="text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1">
              <span>📍 DÃY 3 (TỔ 3)</span>
            </div>
            <div className="text-[10px] text-pink-100 font-semibold mt-0.5">
              1 bàn/hàng • 2 chỗ ngồi
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-700 via-rose-600 to-rose-700 text-white rounded-2xl py-2 px-3 text-center shadow-md border-b-2 border-rose-900">
            <div className="text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1">
              <span>📍 DÃY 4 (TỔ 4)</span>
            </div>
            <div className="text-[10px] text-rose-100 font-semibold mt-0.5">
              1 bàn/hàng • 2 chỗ ngồi
            </div>
          </div>
        </div>

          {/* Seating Grid (Rows 1 to 6: 4 Dãy, mỗi dãy 1 bàn, mỗi bàn gồm 2 chỗ ngồi) */}
          <div className="space-y-4">
            {/* Save state notification toast */}
            {saveToast && (
              <div className="bg-emerald-600 text-white font-black text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in duration-200 justify-center">
                <Check className="w-4 h-4 text-emerald-200" />
                <span>{saveToast}</span>
              </div>
            )}

            {rows.map((rowNum) => {
              const renderSeatCard = (desk?: DeskPosition, seatSide: 'Trái' | 'Phải' = 'Trái') => {
                if (!desk) {
                  return (
                    <div className="rounded-2xl p-2 sm:p-2.5 bg-white/50 border border-dashed border-slate-300 text-center py-3 flex flex-col items-center justify-center">
                      <div className="w-6 h-6 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Plus className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">Chỗ trống</span>
                    </div>
                  );
                }
                const student = getStudentForDesk(desk);
                const isBeingSwapped = isSwapping === desk.id;
                const isDragSource = draggedDeskId === desk.id;
                const isDragTarget = dragOverDeskId === desk.id;
                const hasNotification = awardNotification?.deskId === desk.id;

                // Kiểm tra phân quyền: Chỉ giáo viên hoặc chính học sinh/phụ huynh của học sinh đó mới xem thông tin chi tiết
                const isSelf = currentStudent && student?.id === currentStudent.id;
                const canViewFullDetails = isTeacherLoggedIn || role === 'admin' || isSelf;

                return (
                  <div
                    key={desk.id}
                    draggable={isTeacherLoggedIn && !!student}
                    onDragStart={(e) => handleDragStart(e, desk.id)}
                    onDragOver={(e) => handleDragOver(e, desk.id)}
                    onDragLeave={() => handleDragLeave(desk.id)}
                    onDrop={(e) => handleDrop(e, desk.id)}
                    onClick={() => handleDeskClick(desk)}
                    className={`relative rounded-2xl p-2 sm:p-2.5 transition-all select-none flex flex-col justify-between ${
                      isTeacherLoggedIn ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                    } ${
                      isDragTarget
                        ? 'ring-4 ring-indigo-500 bg-indigo-100 scale-105 shadow-2xl z-30 border-2 border-indigo-600'
                        : isDragSource
                        ? 'opacity-40 ring-2 ring-dashed ring-amber-400 bg-amber-50'
                        : isBeingSwapped
                        ? 'ring-4 ring-amber-400 bg-amber-50 scale-102 shadow-lg z-10'
                        : isSelf
                        ? 'ring-3 ring-emerald-500 bg-emerald-50/80 border-emerald-400 shadow-md'
                        : student
                        ? 'bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-white/60 border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-white/90'
                    }`}
                  >
                    {/* Floating Reward Notification Popup */}
                    {hasNotification && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg z-30 animate-bounce">
                        {awardNotification.text}
                      </div>
                    )}

                    {/* Seat Header: Seat label & Coins */}
                    <div className="flex items-center justify-between gap-1 mb-1 text-[9px] sm:text-[10px]">
                      <span className="font-extrabold text-slate-500 flex items-center space-x-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelf ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                        <span>{isSelf ? 'Chỗ của bạn' : seatSide}</span>
                      </span>

                      {student && canViewFullDetails && (
                        <div className="flex items-center space-x-0.5 bg-amber-100 border border-amber-300 text-amber-900 px-1 py-0.2 rounded-full font-black text-[9px]">
                          <span>🪙</span>
                          <span>{student.coins ?? 0}</span>
                        </div>
                      )}
                    </div>

                    {student ? (
                      <div className="flex items-center space-x-2">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 p-0.5 border shadow-2xs group-hover:scale-105 transition-transform overflow-hidden ${
                            isSelf ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
                          }`}>
                            <img
                              src={student.avatar || getStudentNeutralAvatar(student.id || student.name)}
                              alt={student.name || 'Học sinh'}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-black text-[11px] sm:text-xs truncate leading-tight ${
                            isSelf ? 'text-emerald-900 font-extrabold' : 'text-slate-800 group-hover:text-indigo-700'
                          }`}>
                            {canViewFullDetails ? student.name : 'Bạn cùng lớp'}
                          </h3>

                          {canViewFullDetails ? (
                            <div className="flex items-center space-x-1 text-[9px] text-slate-500 font-semibold truncate">
                              <span>⭐ {student.stars ?? 0}</span>
                              <span>•</span>
                              <span className="font-bold text-indigo-600">{student.group || 'Tổ 1'}</span>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-400 font-medium truncate">
                              {student.group || 'Lớp 5B.2'}
                            </div>
                          )}

                          {isTeacherLoggedIn && (
                            <div className="flex items-center space-x-1 mt-1">
                              <button
                                onClick={(e) => handleQuickAward(e, student.id, desk.id, 1)}
                                title="Cộng 1 Xu khen ngợi"
                                className="bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              >
                                +1
                              </button>
                              <button
                                onClick={(e) => handleQuickAward(e, student.id, desk.id, 5)}
                                title="Cộng 5 Xu phát biểu xuất sắc"
                                className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 text-[8px] font-black px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              >
                                +5
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-1.5 text-center">
                        <div className="w-6 h-6 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Plus className="w-3 h-3" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 mt-0.5 block">
                          Chỗ trống
                        </span>
                      </div>
                    )}
                  </div>
                );
              };

            return (
              <div key={rowNum} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((colNum) => {
                  const tableNum = (rowNum - 1) * 4 + colNum;
                  const deskSeats = safeDesks.filter((d) => d && d.row === rowNum && d.col === colNum);
                  const leftSeat = deskSeats.find((d) => d && d.seat === 1) || deskSeats[0];
                  const rightSeat = deskSeats.find((d) => d && d.seat === 2) || deskSeats[1];

                  return (
                    <div
                      key={`desk-${rowNum}-${colNum}`}
                      className="bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 rounded-3xl p-2.5 sm:p-3 border-2 border-amber-300/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Desk Wooden Header (Mỗi bàn học gồm 2 chỗ ngồi) */}
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-200/80 text-xs">
                        <span className="font-black text-amber-950 flex items-center space-x-1">
                          <span>🪑 BÀN {tableNum}</span>
                          <span className="text-[9px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.2 rounded-md">
                            2 chỗ
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-800">
                          Dãy {colNum} • Hàng {rowNum}
                        </span>
                      </div>

                      {/* 2 Seats Side by Side Inside Desk */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {renderSeatCard(leftSeat, 'Trái')}
                        {renderSeatCard(rightSeat, 'Phải')}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desk Details & Actions Modal */}
      {selectedDesk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-indigo-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-200 block">
                  Chi tiết vị trí
                </span>
                <h3 className="text-lg font-black">{selectedDesk.label}</h3>
              </div>
              <button
                onClick={() => setSelectedDesk(null)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {(() => {
                const student = getStudentForDesk(selectedDesk);

                if (student) {
                  return (
                    <div className="space-y-4">
                      {/* Student Card */}
                      <div className="flex items-center space-x-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                        <img
                          src={student.avatar || getStudentNeutralAvatar(student.id || student.name)}
                          alt={student.name || 'Học sinh'}
                          className="w-16 h-16 rounded-2xl bg-white p-1 border border-indigo-200 shadow-sm"
                        />
                        <div>
                          <h4 className="font-black text-lg text-slate-800">
                            {student.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-500">
                            {student.group || 'Học sinh'} • Lớp 5B.2 Vui Vẻ
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-300">
                              🪙 {student.coins ?? 0} Xu thưởng
                            </span>
                            <span className="bg-purple-100 text-purple-900 font-bold text-xs px-2 py-0.5 rounded-full">
                              ⭐ {student.stars ?? 0} Sao
                            </span>
                          </div>
                          <div className="mt-2.5">
                            <AchievementBadge student={student} variant="compact" />
                          </div>
                        </div>
                      </div>

                      {/* Reward Options */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                          Thưởng / Khen ngợi học sinh
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              awardCoins(student.id, 2, 'Khen ngợi tại chỗ');
                              soundEffects.playCoin();
                              confetti({ particleCount: 30, spread: 50 });
                            }}
                            className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 font-black text-xs text-amber-900 flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all"
                          >
                            <span className="text-lg">🌟</span>
                            <span>+2 Xu Tự Học</span>
                          </button>
                          <button
                            onClick={() => {
                              awardCoins(student.id, 5, 'Phát biểu đúng');
                              soundEffects.playBigCoin();
                              confetti({ particleCount: 50, spread: 60 });
                            }}
                            className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 font-black text-xs text-amber-950 flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all"
                          >
                            <span className="text-lg">🪙</span>
                            <span>+5 Xu Trả Lời</span>
                          </button>
                          <button
                            onClick={() => {
                              awardCoins(student.id, 10, 'Thành tích xuất sắc');
                              soundEffects.playBigCoin();
                              confetti({ particleCount: 80, spread: 80 });
                            }}
                            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-xs flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all shadow-md"
                          >
                            <span className="text-lg">🏆</span>
                            <span>+10 Xu Xuất Sắc</span>
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setIsSwapping(selectedDesk.id);
                            setSelectedDesk(null);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>Chuyển sang bàn khác (Đổi chỗ)</span>
                        </button>

                        <button
                          onClick={() => {
                            updateDeskStudent(selectedDesk.id, undefined);
                            setSelectedDesk(null);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                        >
                          Gỡ học sinh khỏi bàn này (Đặt thành bàn trống)
                        </button>
                      </div>
                    </div>
                  );
                }

                // If desk is empty
                return (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-800 font-bold">
                      Vị trí bàn học này hiện đang trống.
                    </p>

                    {(isTeacherLoggedIn || role === 'admin') ? (
                      <>
                        <p className="text-xs text-slate-500 font-medium">
                          Chọn một học sinh để xếp vào vị trí này:
                        </p>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {safeStudents.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => {
                                updateDeskStudent(selectedDesk.id, st.id);
                                setSelectedDesk(null);
                              }}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-left transition-colors cursor-pointer"
                            >
                              <div className="flex items-center space-x-2.5">
                                <img
                                  src={st.avatar || getStudentNeutralAvatar(st.id || st.name)}
                                  alt={st.name}
                                  className="w-8 h-8 rounded-full bg-white border"
                                />
                                <span className="text-sm font-bold text-slate-800">
                                  {st.name}
                                </span>
                              </div>
                              <span className="text-xs text-indigo-600 font-bold">
                                Xếp vào bàn
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
                        Chỉ Giáo viên chủ nhiệm mới có quyền sắp xếp và thay đổi vị trí chỗ ngồi của học sinh để bảo vệ tính toàn vẹn dữ liệu.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import Student List */}
      <StudentListImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};
