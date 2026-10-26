import React, { useState, useEffect } from 'react';
import { ClassEventAnnouncement } from '../../types';
import { supabase } from '../../lib/supabase';
import { X, Calendar, Clock, MapPin, AlertCircle, Plus, Check, BellRing, Trash2 } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface AdminEventAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (announcement: Omit<ClassEventAnnouncement, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  editingAnnouncement?: ClassEventAnnouncement | null;
}

export const AdminEventAnnouncementModal: React.FC<AdminEventAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingAnnouncement,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00 - 11:30');
  const [location, setLocation] = useState('Lớp 5B.2');
  const [type, setType] = useState<ClassEventAnnouncement['type']>('general');
  const [priority, setPriority] = useState<ClassEventAnnouncement['priority']>('important');
  const [targetAudience, setTargetAudience] = useState<ClassEventAnnouncement['targetAudience']>('all');
  const [isPinned, setIsPinned] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Cập nhật lại form state mỗi khi mở modal hoặc thay đổi sự kiện cần sửa
  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title || '');
      setContent(editingAnnouncement.content || '');
      setDate(editingAnnouncement.date || new Date().toISOString().split('T')[0]);
      setTime(editingAnnouncement.time || '08:00 - 11:30');
      setLocation(editingAnnouncement.location || 'Lớp 5B.2');
      setType(editingAnnouncement.type || 'general');
      setPriority(editingAnnouncement.priority || 'important');
      setTargetAudience(editingAnnouncement.targetAudience || 'all');
      setIsPinned(editingAnnouncement.isPinned ?? true);
    } else {
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('08:00 - 11:30');
      setLocation('Lớp 5B.2');
      setType('general');
      setPriority('important');
      setTargetAudience('all');
      setIsPinned(true);
    }
    setFormError(null);
    setShowConfirmDelete(false);
  }, [editingAnnouncement, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Vui lòng điền đầy đủ tiêu đề và nội dung thông báo sự kiện.');
      return;
    }

    soundEffects.playWorksheetComplete();

    onSave(
      {
        title: title.trim(),
        content: content.trim(),
        date,
        time: time.trim(),
        location: location.trim(),
        type,
        priority,
        targetAudience,
        author: 'Cô Kim Tiến Number Hi!',
        isPinned,
      },
      editingAnnouncement?.id
    );

    try {
      (supabase.from('announcements') as any).upsert?.({
        id: editingAnnouncement?.id || `evt_${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        date,
        time: time.trim(),
        location: location.trim(),
        type,
        priority,
        target_audience: targetAudience,
        author: 'Cô Kim Tiến Number Hi!',
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Offline fallback
    }

    onClose();
  };

  const handleDeleteCurrent = () => {
    if (editingAnnouncement && onDelete) {
      soundEffects.playClick();
      onDelete(editingAnnouncement.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-amber-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
              📢
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                Thông Báo Sự Kiện • Lớp 5B.2 (Năm học 2026 - 2027)
              </span>
              <h3 className="text-lg font-black">
                {editingAnnouncement ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Thông Báo Sự Kiện Mới'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {formError && (
            <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tiêu Đề Sự Kiện / Thông Báo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Ví dụ: 🎉 Buổi Ngoại Khóa Khám Phá Nông Trại Xanh"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phân Loại Sự Kiện
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
              >
                <option value="trip">🚌 Buổi Ngoại Khóa / Dã Ngoại</option>
                <option value="exam">📝 Lịch Bài Kiểm Tra</option>
                <option value="reminder">⭐ Lời Nhắc Nhở Học Tập</option>
                <option value="meeting">👨‍👩‍👧‍👦 Họp Phụ Huynh / Sinh Hoạt</option>
                <option value="general">📢 Thông Báo Chung</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mức Độ Nổi Bật
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
              >
                <option value="important">⭐ Quan trọng</option>
                <option value="urgent">🚨 Khẩn cấp / Chú ý</option>
                <option value="normal">Thông thường</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ngày Diễn Ra *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Khung Giờ
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="07:30 - 11:30"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Địa Điểm
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ví dụ: Phòng học 5B.2"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Đối Tượng Nhận Tin
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
              >
                <option value="all">👨‍👩‍👧‍👦 Tất cả (Học sinh & Phụ huynh)</option>
                <option value="students">🎒 Chỉ Học sinh</option>
                <option value="parents">🌱 Chỉ Phụ huynh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nội Dung Chi Tiết Dặn Dò Học Sinh & Phụ Huynh *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Nhập chi tiết thông báo, những điều học sinh và phụ huynh cần chuẩn bị..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium leading-relaxed focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded-md text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Ghim nổi bật trên đầu Dashboard (Học sinh & Phụ huynh)</span>
            </label>
          </div>

          {/* Footer buttons with In-Modal Delete Support */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {editingAnnouncement && onDelete ? (
              <div>
                {showConfirmDelete ? (
                  <div className="flex items-center space-x-1.5 animate-in fade-in">
                    <span className="text-[11px] font-bold text-rose-600">Xác nhận xóa?</span>
                    <button
                      type="button"
                      onClick={handleDeleteCurrent}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg shadow-xs cursor-pointer"
                    >
                      Xóa ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-bold p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa sự kiện này</span>
                  </button>
                )}
              </div>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingAnnouncement ? 'Lưu Cập Nhật' : 'Đăng Thông Báo Ngay'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEventAnnouncementModal;
