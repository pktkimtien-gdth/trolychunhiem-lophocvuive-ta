import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { AIVideoItem } from '../types';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { useAdminPermission } from '../hooks/useAdminPermission';
import {
  Video,
  Play,
  Plus,
  Search,
  ExternalLink,
  Sparkles,
  BookOpen,
  Heart,
  Eye,
  Clock,
  Trash2,
  X,
  Copy,
  Check,
  Film,
  FolderPlus,
  HelpCircle,
  Share2,
  Tv,
  Layers,
  Award
} from 'lucide-react';

interface AIVideoLibraryProps {
  onOpenWorksheet?: (worksheetId: string) => void;
  onOpenUploadMedia?: () => void;
}

// Helper to convert any YouTube or Google Drive video URL to an iframe embed URL
export function convertToEmbedUrl(url: string): { embedUrl: string; sourceType: 'google_drive' | 'youtube' | 'uploaded' | 'custom' } {
  if (!url) return { embedUrl: '', sourceType: 'custom' };
  const trimmed = url.trim();

  // 1. Google Drive / Google Docs video URLs
  // Formats:
  // https://docs.google.com/videos/d/1FSqABAdsKqlYQGRCzRh0xCiasESEEZg2TboL_iKoxyM/play
  // https://drive.google.com/file/d/1FSqABAdsKqlYQGRCzRh0xCiasESEEZg2TboL_iKoxyM/view
  // https://drive.google.com/file/d/1FSqABAdsKqlYQGRCzRh0xCiasESEEZg2TboL_iKoxyM/preview
  // https://drive.google.com/open?id=1FSqABAdsKqlYQGRCzRh0xCiasESEEZg2TboL_iKoxyM
  if (trimmed.includes('docs.google.com/videos/d/') || trimmed.includes('drive.google.com')) {
    const driveIdMatch =
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      const fileId = driveIdMatch[1];
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        sourceType: 'google_drive',
      };
    }
  }

  // 2. YouTube URLs
  // Formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    let videoId = '';
    if (trimmed.includes('youtu.be/')) {
      const parts = trimmed.split('youtu.be/');
      videoId = parts[1]?.split('?')[0] || '';
    } else if (trimmed.includes('watch?v=')) {
      const parts = trimmed.split('watch?v=');
      videoId = parts[1]?.split('&')[0] || '';
    } else if (trimmed.includes('/embed/')) {
      const parts = trimmed.split('/embed/');
      videoId = parts[1]?.split('?')[0] || '';
    }

    if (videoId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
        sourceType: 'youtube',
      };
    }
  }

  // 3. Direct video files or blob URLs
  if (trimmed.startsWith('blob:') || trimmed.endsWith('.mp4') || trimmed.endsWith('.webm')) {
    return {
      embedUrl: trimmed,
      sourceType: 'uploaded',
    };
  }

  return {
    embedUrl: trimmed,
    sourceType: 'custom',
  };
}

export const AIVideoLibrary: React.FC<AIVideoLibraryProps> = ({
  onOpenWorksheet,
  onOpenUploadMedia,
}) => {
  const {
    aiVideos,
    addAIVideo,
    deleteAIVideo,
    isTeacherLoggedIn,
    currentStudent,
    awardCoins,
    role,
  } = useClassroom();
  const { executeDestructiveAction } = useAdminPermission();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<AIVideoItem | null>(null);
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Modal Thêm Video mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSubject, setNewSubject] = useState('Tiếng Việt');
  const [newGrade, setNewGrade] = useState('Lớp 5');
  const [newDuration, setNewDuration] = useState('08:30');
  const [newDescription, setNewDescription] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [newPixarPrompt, setNewPixarPrompt] = useState('');

  // Sample prompt preset for Canva
  const defaultPixarPrompt =
    'A cheerful 3D Disney Pixar style 5th grade Vietnamese classroom scene, joyful students in colorful uniforms exploring animated glowing science hologram, vibrant warm sunlight, volumetric lighting, high quality render 8k';

  const subjects = [
    { id: 'all', label: 'Tất cả bài giảng' },
    { id: 'Tiếng Việt', label: 'Tiếng Việt' },
    { id: 'Toán', label: 'Toán' },
    { id: 'Khoa học', label: 'Khoa học' },
    { id: 'Lịch sử và Địa lí', label: 'Lịch sử & Địa lí' },
    { id: 'Tin học', label: 'Tin học' },
    { id: 'Hoạt động trải nghiệm', label: 'HĐ Trải nghiệm' },
    { id: 'Kỹ năng sống & Môi trường', label: 'Kỹ năng sống' },
  ];

  const filteredVideos = aiVideos.filter((video) => {
    const matchSubject =
      selectedSubject === 'all' ||
      video.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  const handleOpenVideo = (video: AIVideoItem) => {
    soundEffects.playClick();
    setActiveVideo(video);
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  const handleToggleLike = (video: AIVideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playCoin();
    const isLiked = likedVideoIds.includes(video.id);
    if (isLiked) {
      setLikedVideoIds((prev) => prev.filter((id) => id !== video.id));
    } else {
      setLikedVideoIds((prev) => [...prev, video.id]);
      if (currentStudent) {
        awardCoins(currentStudent.id, 1);
      }
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleCopyPrompt = (promptText: string, videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(videoId);
    soundEffects.playCorrect();
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const handleCreateVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const { embedUrl, sourceType } = convertToEmbedUrl(newUrl);

    // Fallback thumbnail if empty
    const thumbnail =
      newThumbnail.trim() ||
      (newSubject === 'Tiếng Việt'
        ? 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80'
        : newSubject === 'Toán'
        ? 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80');

    addAIVideo({
      title: newTitle.trim(),
      subject: newSubject,
      grade: newGrade || 'Lớp 5',
      duration: newDuration || '08:00',
      description:
        newDescription.trim() ||
        'Bài giảng số trực quan thiết kế cho học sinh Lớp 5 với tinh thần Vui Đến Trường.',
      originalUrl: newUrl.trim(),
      embedUrl,
      thumbnailUrl: thumbnail,
      sourceType,
      pixarPrompt: newPixarPrompt.trim() || defaultPixarPrompt,
      viewsCount: 1,
      likesCount: 0,
    });

    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    // Reset Form
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setNewThumbnail('');
    setNewPixarPrompt('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner: Vui Đến Trường AI Video Library */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center space-x-1">
                <span>✨ vutoitruong</span>
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                🎥 Video Bài Giảng Lớp 5
              </span>
              <span className="bg-emerald-400 text-emerald-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                {aiVideos.length} Video Bài Giảng
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs">
              Kho Video Bài Giảng AI • Vui Đến Trường
            </h1>

            <p className="text-white/90 text-sm sm:text-base leading-relaxed font-medium">
              Không gian học tập thị giác sinh động: bài giảng minh họa bằng hình ảnh 3D hoạt hình Pixar/Disney,
              nhúng trực tiếp từ <strong className="text-amber-200">Google Drive</strong> và <strong className="text-amber-200">YouTube</strong>,
              kèm bộ trắc nghiệm phản xạ giúp học sinh lớp 5 tiếp thu kiến thức tự nhiên, hào hứng!
            </p>

            <div className="flex items-center space-x-4 pt-1 text-xs text-amber-200 font-bold flex-wrap gap-y-1">
              <span>🌈 Tinh thần Vui Đến Trường</span>
              <span>•</span>
              <span>🎯 Đầy đủ môn học Lớp 5</span>
              <span>•</span>
              <span>💡 Gợi ý Prompt Canva 3D Pixar</span>
            </div>
          </div>

          {/* Teacher Upload & Embed Buttons - Hidden for students */}
          {role === 'teacher' && (
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-400/30 hover:scale-[1.02] active:scale-98 transition-all text-sm cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Dán Link Nhúng (YouTube / Drive)</span>
              </button>

              {onOpenUploadMedia && (
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenUploadMedia();
                  }}
                  className="flex items-center justify-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2.5 rounded-2xl border border-white/20 transition-all text-xs cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-pink-300" />
                  <span>Tải Lên Video & Hình Ảnh Lớp</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm video bài giảng, tên môn học, chủ đề..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                soundEffects.playClick();
                setSelectedSubject(sub.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedSubject === sub.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Chưa tìm thấy video bài giảng phù hợp</h3>
          <p className="text-xs text-slate-500 mb-6">
            Thầy cô có thể dán liên kết Google Drive hoặc YouTube để đưa bài giảng mới vào kho video ngay lập tức!
          </p>
          {role === 'teacher' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài giảng đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const isLiked = likedVideoIds.includes(video.id);
            const totalLikes = (video.likesCount || 0) + (isLiked ? 1 : 0);

            // Subject Tag Colors
            const getSubjectColor = (subj: string) => {
              if (subj.includes('Toán')) return 'bg-blue-50 text-blue-700 border-blue-200';
              if (subj.includes('Tiếng Việt')) return 'bg-rose-50 text-rose-700 border-rose-200';
              if (subj.includes('Khoa học')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (subj.includes('Lịch sử')) return 'bg-amber-50 text-amber-700 border-amber-200';
              if (subj.includes('Tin học')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
              return 'bg-purple-50 text-purple-700 border-purple-200';
            };

            return (
              <div
                key={video.id}
                onClick={() => handleOpenVideo(video)}
                className="group bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-13 h-13 rounded-2xl bg-amber-400/90 text-amber-950 flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 group-hover:bg-amber-300 transition-all">
                      <Play className="w-6 h-6 fill-amber-950 ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>{video.duration}</span>
                  </div>

                  {/* Source Badge */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    {video.sourceType === 'google_drive' ? (
                      <span className="bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                        <span>📁 Google Drive</span>
                      </span>
                    ) : video.sourceType === 'youtube' ? (
                      <span className="bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                        <span>▶ YouTube</span>
                      </span>
                    ) : (
                      <span className="bg-purple-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                        <span>🎬 Video Số AI</span>
                      </span>
                    )}

                    {video.pixarPrompt && (
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>3D Pixar</span>
                      </span>
                    )}
                  </div>

                  {/* Teacher Delete Option - strictly protected by useAdminPermission */}
                  {(role === 'teacher' || role === 'admin') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        executeDestructiveAction(
                          () => deleteAIVideo(video.id),
                          { actionName: `xóa video "${video.title}"` }
                        );
                      }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Xóa video bài giảng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border ${getSubjectColor(
                          video.subject
                        )}`}
                      >
                        {video.subject}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {video.grade}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
                      {video.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  </div>

                  {/* Actions & Stats Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 text-xs text-slate-500 font-semibold">
                      <button
                        onClick={(e) => handleToggleLike(video, e)}
                        className={`flex items-center space-x-1 transition-colors ${
                          isLiked ? 'text-pink-600 font-bold' : 'hover:text-pink-600'
                        }`}
                        title="Thích video này (+1 Xu)"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-600' : ''}`} />
                        <span>{totalLikes}</span>
                      </button>

                      <span className="flex items-center space-x-1 text-slate-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{video.viewsCount || 100}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {video.pixarPrompt && (
                        <button
                          onClick={(e) => handleCopyPrompt(video.pixarPrompt!, video.id, e)}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center space-x-1 transition-all"
                          title="Sao chép prompt 3D Pixar để tạo ảnh trên Canva"
                        >
                          {copiedPromptId === video.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>Prompt 3D</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenVideo(video)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Xem</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIDEO PLAYER THEATER MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-4 text-white">
              <div className="flex items-center space-x-2.5 truncate">
                <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md text-xs font-black shrink-0">
                  {activeVideo.subject}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate">
                  {activeVideo.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={activeVideo.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center space-x-1 transition-colors"
                  title="Mở link gốc ngoài trình duyệt"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mở link gốc</span>
                </a>

                <button
                  onClick={handleCloseVideo}
                  className="w-8 h-8 rounded-xl bg-slate-700/80 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Đóng video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Responsive 16:9 Video Player Viewport */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {activeVideo.sourceType === 'uploaded' && activeVideo.embedUrl.endsWith('.mp4') ? (
                <video
                  src={activeVideo.embedUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={activeVideo.embedUrl}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              )}
            </div>

            {/* Video Controls & Educational Meta Info */}
            <div className="p-5 bg-slate-900 text-slate-200 space-y-4 overflow-y-auto max-h-[35vh]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {activeVideo.title}
                  </h2>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span>Thời lượng: {activeVideo.duration}</span>
                    <span>•</span>
                    <span>Chương trình: {activeVideo.grade}</span>
                    <span>•</span>
                    <span>Nguồn: {activeVideo.sourceType === 'google_drive' ? 'Google Drive' : 'YouTube'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleToggleLike(activeVideo, e)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      likedVideoIds.includes(activeVideo.id)
                        ? 'bg-pink-600/20 text-pink-400 border-pink-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedVideoIds.includes(activeVideo.id) ? 'fill-pink-500 text-pink-500' : ''
                      }`}
                    />
                    <span>Thích bài giảng</span>
                  </button>

                  {activeVideo.pixarPrompt && (
                    <button
                      onClick={() => handleCopyPrompt(activeVideo.pixarPrompt!, activeVideo.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
                    >
                      {copiedPromptId === activeVideo.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Đã sao chép prompt Canva!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Chép Prompt 3D Pixar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Description and Learning Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2 space-y-2 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nội Dung Trọng Tâm & Dặn Dò Học Sinh</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed font-normal">
                    {activeVideo.description}
                  </p>
                </div>

                <div className="space-y-2 bg-gradient-to-br from-indigo-950/70 to-purple-950/70 p-3.5 rounded-2xl border border-indigo-700/40">
                  <span className="font-bold text-pink-300 uppercase tracking-wider text-[11px] flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-pink-400" />
                    <span>Luyện Tập Đổi Xu Thưởng</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Xem xong bài giảng, hãy vào <strong>Kho Bài Tập</strong> để làm bài ôn luyện và nhận từ 10 - 15 Xu thưởng!
                  </p>
                  {onOpenWorksheet && activeVideo.companionQuizId && (
                    <button
                      onClick={() => {
                        handleCloseVideo();
                        onOpenWorksheet(activeVideo.companionQuizId!);
                      }}
                      className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-1.5 rounded-xl text-center block transition-all"
                    >
                      Làm Phiếu Bài Tập Ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM VIDEO NHÚNG MỚI (YOUTUBE / GOOGLE DRIVE) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Thêm Video Bài Giảng AI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ dán link nhúng Google Drive hoặc YouTube
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Helper Box for Google Drive & YouTube */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Cách dán liên kết video chuẩn:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>
                  <strong>Google Drive:</strong> Dán link chia sẻ hoặc link xem như <code className="bg-amber-200/60 px-1 py-0.2 rounded font-mono text-[10px]">https://docs.google.com/videos/d/ID/play</code> hoặc <code className="bg-amber-200/60 px-1 py-0.2 rounded font-mono text-[10px]">https://drive.google.com/file/d/ID/view</code> (hệ thống sẽ tự động chuyển thành định dạng nhúng preview an toàn).
                </li>
                <li>
                  <strong>YouTube:</strong> Dán link <code className="bg-amber-200/60 px-1 py-0.2 rounded font-mono text-[10px]">https://youtube.com/watch?v=...</code> hoặc <code className="bg-amber-200/60 px-1 py-0.2 rounded font-mono text-[10px]">https://youtu.be/...</code>
                </li>
              </ul>
            </div>

            <form onSubmit={handleCreateVideoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề bài giảng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Video Bài Giảng AI: Luyện từ và câu Lớp 5 - Khám phá Đại từ"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đường dẫn Video (Google Drive / YouTube) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://docs.google.com/videos/d/1FSqABAdsKqlYQGRCzRh0xCiasESEEZg2TboL_iKoxyM/play"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-white"
                  >
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Toán">Toán</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Đạo đức">Đạo đức</option>
                    <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                    <option value="Kỹ năng sống & Môi trường">Kỹ năng sống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder="Lớp 5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời lượng
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="08:45"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả bài giảng & Dặn dò học sinh
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tóm tắt ngắn gọn mục tiêu bài học hoặc dặn dò các em..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Ảnh Thumbnail (Tùy chọn)
                </label>
                <input
                  type="url"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/... (để trống sẽ tự động lấy hình theo môn học)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Prompt tạo ảnh 3D Pixar/Disney trên Canva (Tùy chọn)</span>
                  <button
                    type="button"
                    onClick={() => setNewPixarPrompt(defaultPixarPrompt)}
                    className="text-[11px] text-indigo-600 hover:underline font-bold"
                  >
                    Dùng mẫu gợi ý
                  </button>
                </label>
                <textarea
                  rows={2}
                  value={newPixarPrompt}
                  onChange={(e) => setNewPixarPrompt(e.target.value)}
                  placeholder="3D Pixar style cute classroom scene..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-[11px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu & Thêm Vào Kho Video</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
