import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { ClassEventAnnouncement } from '../../types';
import { INITIAL_EVENT_ANNOUNCEMENTS } from '../../data/initialData';
import { AdminEventAnnouncementModal } from '../admin/AdminEventAnnouncementModal';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Pin,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { useAdminPermission } from '../../hooks/useAdminPermission';

const STORAGE_KEY = 'lop_hoc_5b2_announcements_v2';
const HIDE_SECTION_STORAGE_KEY = 'lop_hoc_5b2_hide_events_section_v1';

interface HighlightedEventAnnouncementsProps {
  audience?: 'all' | 'students' | 'parents';
  compact?: boolean;
}

export const HighlightedEventAnnouncements: React.FC<HighlightedEventAnnouncementsProps> = ({
  audience = 'all',
  compact = false,
}) => {
  const { role, isTeacherLoggedIn } = useClassroom();
  const { canPerformDestructiveAction, executeDestructiveAction } = useAdminPermission();

  // Danh sách sự kiện đã lưu
  const [announcements, setAnnouncements] = useState<ClassEventAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EVENT_ANNOUNCEMENTS;
  });

  // Tùy chọn Ẩn/Hiện toàn bộ khu vực này trên Trang chủ
  const [isSectionHidden, setIsSectionHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_SECTION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassEventAnnouncement | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tự động lưu vào localStorage mỗi khi danh sách sự kiện thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
    } catch (e) {
      console.error(e);
    }
  }, [announcements]);

  // Lưu trạng thái Ẩn/Hiện toàn bộ mục sự kiện
  const handleToggleHideSection = () => {
    const nextState = !isSectionHidden;
    setIsSectionHidden(nextState);
    try {
      localStorage.setItem(HIDE_SECTION_STORAGE_KEY, String(nextState));
    } catch (e) {
      console.error(e);
    }
    soundEffects.playClick();
    setToastMessage(
      nextState
        ? 'Đã ẨN khu vực Sự Kiện & Lời Nhắc khỏi trang chủ của Học sinh và Phụ huynh!'
        : 'Đã HIỆN lại khu vực Sự Kiện & Lời Nhắc trên trang chủ!'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Thêm hoặc Chỉnh sửa sự kiện
  const handleSaveAnnouncement = (
    data: Omit<ClassEventAnnouncement, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...data } : item))
      );
      setToastMessage('Đã cập nhật thông báo sự kiện thành công!');
    } else {
      const newItem: ClassEventAnnouncement = {
        ...data,
        id: `evt_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setAnnouncements((prev) => [newItem, ...prev]);
      setToastMessage('Đã tạo và đăng thông báo sự kiện mới!');
    }
    setEditingItem(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Thực hiện XÓA sự kiện (Bảo vệ bởi useAdminPermission hook)
  const handleExecuteDelete = (id: string) => {
    executeDestructiveAction(
      () => {
        setAnnouncements((prev) => prev.filter((item) => item.id !== id));
        setPendingDeleteId(null);
        soundEffects.playClick();
        setToastMessage('Đã xóa thông báo sự kiện thành công!');
        setTimeout(() => setToastMessage(null), 3000);
      },
      {
        actionName: 'xóa sự kiện thông báo',
        onError: (err) => {
          setPendingDeleteId(null);
          setToastMessage(err);
          setTimeout(() => setToastMessage(null), 4000);
        },
      }
    );
  };

  // Xóa toàn bộ sự kiện (Bảo vệ bởi useAdminPermission hook)
  const handleClearAllAnnouncements = () => {
    executeDestructiveAction(
      () => {
        setAnnouncements([]);
        setPendingDeleteId(null);
        soundEffects.playClick();
        setToastMessage('Đã xóa toàn bộ sự kiện thông báo!');
        setTimeout(() => setToastMessage(null), 3000);
      },
      {
        actionName: 'xóa toàn bộ sự kiện',
        onError: (err) => {
          setPendingDeleteId(null);
          setToastMessage(err);
          setTimeout(() => setToastMessage(null), 4000);
        },
      }
    );
  };

  // Khôi phục lại 3 sự kiện mẫu ban đầu
  const handleResetSampleAnnouncements = () => {
    setAnnouncements(INITIAL_EVENT_ANNOUNCEMENTS);
    soundEffects.playWorksheetComplete();
    setToastMessage('Đã khôi phục các thông báo sự kiện mẫu!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lọc theo đối tượng người xem (Học sinh, Phụ huynh, hoặc Tất cả)
  const filteredAnnouncements = announcements.filter((item) => {
    if (audience === 'all') return true;
    if (!item.targetAudience || item.targetAudience === 'all') return true;
    return item.targetAudience === audience;
  });

  // Nếu mục bị giáo viên ẨN:
  // - Học sinh & Phụ huynh: Hoàn toàn không nhìn thấy
  // - Giáo viên (Admin): Hiển thị thanh thông báo nhỏ để có thể bật lại bất cứ lúc nào
  if (isSectionHidden) {
    if (!isTeacherLoggedIn) return null;

    return (
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
          <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Khu vực <strong>"Sự Kiện & Lời Nhắc Nổi Bật"</strong> đang được <strong>ẨN</strong> đối với Học sinh & Phụ huynh.
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleToggleHideSection}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-1 cursor-pointer transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hiện lại trên trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  // Nếu không có sự kiện nào:
  // - Nếu không phải giáo viên: Ẩn hoàn toàn
  // - Nếu là giáo viên: Hiển thị khung trống để giáo viên biết và có nút Tạo mới
  if (filteredAnnouncements.length === 0 && !isTeacherLoggedIn) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3 font-['Quicksand',sans-serif]">
      {/* Toast thông báo kết quả */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white hover:text-emerald-200 text-xs font-black ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header bar: Tiêu đề & Các nút thao tác Quản trị viên */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-sm shadow-xs animate-bounce">
            📢
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
              <span>Sự Kiện & Lời Nhắc Nổi Bật Lớp 5B.2</span>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                Năm học 2026 - 2027
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              Các hoạt động ngoại khóa, lịch kiểm tra và thông tin quan trọng không thể bỏ lỡ
            </p>
          </div>
        </div>

        {/* Bảng điều khiển Quản trị viên */}
        {isTeacherLoggedIn && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {announcements.length > 0 && (
              <button
                type="button"
                onClick={handleToggleHideSection}
                title="Ẩn khu vực này khỏi màn hình của học sinh và phụ huynh"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Ẩn mục này</span>
              </button>
            )}

            {announcements.length > 0 ? (
              <button
                type="button"
                onClick={() => setPendingDeleteId('all')}
                title="Xóa toàn bộ các thông báo sự kiện đang hiển thị"
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Xóa hết ({announcements.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSampleAnnouncements}
                title="Khôi phục lại các thông báo mẫu"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Nạp lại mẫu</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setShowModal(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Sự Kiện Mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Hộp thoại xác nhận xóa TOÀN BỘ sự kiện */}
      {pendingDeleteId === 'all' && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-rose-900 text-xs sm:text-sm font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Thầy cô có chắc muốn xóa TOÀN BỘ các thông báo sự kiện không?</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPendingDeleteId(null)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleClearAllAnnouncements}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
            >
              Xác nhận xóa hết
            </button>
          </div>
        </div>
      )}

      {/* Trạng thái danh sách rỗng (Dành cho Giáo viên) */}
      {filteredAnnouncements.length === 0 && isTeacherLoggedIn && (
        <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
            📢
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm sm:text-base">
              Hiện Chưa Có Thông Báo Sự Kiện Nào
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
              Các sự kiện cũ đã được xóa. Thầy cô có thể bấm "Tạo Sự Kiện Mới" để đăng lịch dã ngoại, lịch kiểm tra hoặc thông báo dặn dò cho lớp.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl shadow-xs hover:from-amber-600 hover:to-orange-600 cursor-pointer transition-all"
            >
              + Tạo Sự Kiện Đầu Tiên
            </button>
            <button
              type="button"
              onClick={handleResetSampleAnnouncements}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Nạp lại 3 sự kiện mẫu
            </button>
          </div>
        </div>
      )}

      {/* Lưới các thẻ sự kiện nổi bật (Floating Highlighted Cards Grid) */}
      {filteredAnnouncements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAnnouncements.map((item) => {
            const isUrgent = item.priority === 'urgent';
            const isExam = item.type === 'exam';
            const isTrip = item.type === 'trip';

            const gradientBg = isUrgent
              ? 'from-rose-500/10 via-amber-500/10 to-orange-500/10 border-rose-300 shadow-rose-500/5'
              : isExam
              ? 'from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-300 shadow-blue-500/5'
              : isTrip
              ? 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-300 shadow-emerald-500/5'
              : 'from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-300 shadow-amber-500/5';

            const badgeColor = isUrgent
              ? 'bg-rose-500 text-white'
              : isExam
              ? 'bg-blue-600 text-white'
              : isTrip
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-500 text-white';

            const isPendingDelete = pendingDeleteId === item.id;

            return (
              <div
                key={item.id}
                className={`relative bg-gradient-to-br ${gradientBg} border-2 rounded-3xl p-4 sm:p-4.5 shadow-md flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden`}
              >
                {/* Lớp phủ Xác nhận Xóa tức thì trực tiếp trên thẻ (Không bị chặn bởi iframe sandbox) */}
                {isPendingDelete && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl p-4 flex flex-col items-center justify-center text-center z-20 space-y-3 animate-in fade-in">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Xác nhận xóa sự kiện này?
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2 px-2">
                        "{item.title}"
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteDelete(item.id);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
                      >
                        Xóa ngay
                      </button>
                    </div>
                  </div>
                )}

                {item.isPinned && (
                  <div className="absolute -top-2.5 right-4 bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1 border border-amber-300 z-10">
                    <Pin className="w-2.5 h-2.5 fill-current" />
                    <span>NỔI BẬT</span>
                  </div>
                )}

                <div className="space-y-2">
                  {/* Huy hiệu loại sự kiện & Ngày tháng */}
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                      {item.type === 'trip'
                        ? '🚌 Ngoại Khóa'
                        : item.type === 'exam'
                        ? '📝 Kiểm Tra'
                        : item.type === 'reminder'
                        ? '⭐ Lời Nhắc'
                        : item.type === 'meeting'
                        ? '👨‍👩‍👧‍👦 Họp Lớp'
                        : '📢 Thông Báo'}
                    </span>

                    <div className="flex items-center space-x-1 text-[11px] font-extrabold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  {/* Tiêu đề */}
                  <h4 className="font-black text-sm text-slate-900 leading-snug">
                    {item.title}
                  </h4>

                  {/* Nội dung chi tiết */}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {item.content}
                  </p>
                </div>

                {/* Thông tin phụ & Nút bấm sửa/xóa dành cho Giáo viên */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    {item.time && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.time}</span>
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">{item.location}</span>
                      </span>
                    )}
                  </div>

                  {isTeacherLoggedIn && (
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setShowModal(true);
                        }}
                        title="Chỉnh sửa nội dung sự kiện"
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        aria-label="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteId(item.id);
                        }}
                        title="Xóa sự kiện này khỏi bảng tin"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        aria-label="Xóa sự kiện"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chỉnh Sửa / Tạo Mới Thông Báo Sự Kiện */}
      {showModal && (
        <AdminEventAnnouncementModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveAnnouncement}
          onDelete={handleExecuteDelete}
          editingAnnouncement={editingItem}
        />
      )}
    </div>
  );
};
