import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Sparkles,
  Trash2,
  CheckCircle2,
  FileCheck,
  FolderPlus,
  Tv
} from 'lucide-react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVideoLibrary?: () => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onOpenVideoLibrary,
}) => {
  const {
    mediaUploads,
    addMediaUpload,
    deleteMediaUpload,
    isTeacherLoggedIn,
    currentStudent,
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEffects.playClick();
    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');
    setTitle(file.name.replace(/\.[^/.]+$/, ''));

    // Create object URL for local preview
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setMediaUrl(previewUrl);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mediaUrl.trim()) return;

    addMediaUpload({
      title: title.trim(),
      type: mediaType,
      url: mediaUrl.trim(),
      caption: caption.trim() || 'Khoảnh khắc lớp học Lớp 5B.2 Vui Vẻ - Vui Đến Trường',
      uploadedBy: currentStudent ? currentStudent.name : isTeacherLoggedIn ? 'Cô Kim Tiến Number Hi!' : 'Thành viên 5B.2',
      fileSize: '3.2 MB',
    });

    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });

    // Reset Form
    setTitle('');
    setMediaUrl('');
    setCaption('');
    setFilePreview(null);
    setActiveTab('gallery');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Tải Lên Video & Hình Ảnh Lớp Học
              </h3>
              <p className="text-xs text-slate-500">
                Lưu giữ kỷ niệm & bài giảng số Lớp 5B.2 Vui Vẻ • Vui Đến Trường
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'upload' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Tải Lên
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'gallery' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Bộ Sưu Tập ({mediaUploads.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: FORM TẢI LÊN */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-6 text-center bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
              <input
                type="file"
                id="media-file-input"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="media-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-xs sm:text-sm text-slate-800">
                    Bấm để chọn file ảnh hoặc video từ máy tính / điện thoại
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ PNG, JPG, GIF, WebP, MP4, WebM
                  </p>
                </div>
                <span className="bg-indigo-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs">
                  Chọn Tệp Tin
                </span>
              </label>
            </div>

            {/* Preview if chosen */}
            {filePreview && (
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-200 max-h-48">
                {mediaType === 'video' ? (
                  <video src={filePreview} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={filePreview} alt="Xem trước" className="w-full h-full object-cover" />
                )}
                <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Xem trước: {mediaType === 'video' ? 'Video' : 'Hình ảnh'}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề ảnh / video <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Khoảnh khắc Lễ Khai Giảng - Chuyến xe tri thức Lớp 5B.2"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đường dẫn Trực Tuyến (URL Ảnh / Video)
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  setFilePreview(e.target.value);
                }}
                placeholder="https://images.unsplash.com/... hoặc link ảnh/video trực tiếp"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono text-[11px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú & Cảm xúc (Caption)
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Chia sẻ kỷ niệm hoặc thông điệp tích cực Vui Đến Trường..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {onOpenVideoLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVideoLibrary();
                  }}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Dán link YouTube / Drive vào Kho Video AI</span>
                </button>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/25 transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tải Lên Ngay</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: GALLERY OF UPLOADED MEDIA */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {mediaUploads.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Chưa có ảnh hoặc video nào được tải lên.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediaUploads.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative flex flex-col justify-between"
                  >
                    <div className="aspect-video w-full bg-slate-800 overflow-hidden relative">
                      {item.type === 'video' ? (
                        <video src={item.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {item.type === 'video' ? '🎬 Video' : '📸 Hình ảnh'}
                      </span>
                    </div>

                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          {item.title}
                        </h4>
                        {isTeacherLoggedIn && (
                          <button
                            onClick={() => deleteMediaUpload(item.id)}
                            className="text-slate-400 hover:text-red-500"
                            title="Xóa tệp này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {item.caption}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-200/50">
                        <span>Đăng bởi: {item.uploadedBy}</span>
                        <span>{item.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
