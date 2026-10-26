import React, { useState, useEffect } from 'react';
import { supabase, SupabaseLink } from '../../lib/supabase';
import { useClassroom } from '../../context/ClassroomContext';
import {
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Bookmark,
  Sparkles,
  RefreshCw,
  Database,
  X,
  Check
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { useAdminPermission } from '../../hooks/useAdminPermission';

const INITIAL_FALLBACK_LINKS: SupabaseLink[] = [
  {
    id: 1,
    title: 'Hành Trang Số - Sách Giáo Khoa & Bài Tập Lớp 5',
    url: 'https://hanhtrangso.nxbgd.vn',
    description: 'Kho học liệu số chính thức của Nhà xuất bản Giáo dục Việt Nam dành cho học sinh Lớp 5.',
    category: 'Học Liệu Số',
    icon: '📚',
  },
  {
    id: 2,
    title: 'Cổng Học Trực Tuyến OLM - Lớp 5B.2',
    url: 'https://olm.vn',
    description: 'Luyện tập toán, tiếng việt và khoa học với hàng ngàn bài tập tương tác có chấm điểm.',
    category: 'Luyện Tập',
    icon: '📐',
  },
  {
    id: 3,
    title: 'Trắc Nghiệm Vui Học & Trò Chơi Giáo Dục Wordwall',
    url: 'https://wordwall.net',
    description: 'Các trò chơi tương tác kiểm tra từ vựng, ngữ pháp và phép tính nhanh đầu giờ học.',
    category: 'Trò Chơi',
    icon: '🎮',
  },
];

export const SupabaseLinksManager: React.FC = () => {
  const { isTeacherLoggedIn, role } = useClassroom();
  const { executeDestructiveAction } = useAdminPermission();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [links, setLinks] = useState<SupabaseLink[]>(() => {
    try {
      const saved = localStorage.getItem('lop_hoc_5b2_links_cache');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FALLBACK_LINKS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<SupabaseLink | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Học Liệu Số');
  const [icon, setIcon] = useState('🔗');

  // Load from Supabase
  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data && data.length > 0) {
        setLinks(data);
        localStorage.setItem('lop_hoc_5b2_links_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Lỗi kết nối Supabase links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleOpenAdd = () => {
    setEditingLink(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory('Học Liệu Số');
    setIcon('🔗');
    setShowAddModal(true);
  };

  const handleOpenEdit = (link: SupabaseLink) => {
    setEditingLink(link);
    setTitle(link.title);
    setUrl(link.url);
    setDescription(link.description || '');
    setCategory(link.category || 'Học Liệu Số');
    setIcon(link.icon || '🔗');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    soundEffects.playClick();
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    if (editingLink) {
      // Edit
      const updated: SupabaseLink = {
        ...editingLink,
        title: title.trim(),
        url: cleanUrl,
        description: description.trim(),
        category: category.trim(),
        icon,
      };

      setLinks((prev) => prev.map((l) => (l.id === editingLink.id ? updated : l)));

      try {
        await supabase
          .from('links')
          .update({
            title: title.trim(),
            url: cleanUrl,
            description: description.trim(),
            category: category.trim(),
            icon,
          })
          .eq('id', editingLink.id);
      } catch (err) {
        console.warn('Supabase update links fallback:', err);
      }
    } else {
      // Add new
      const newLink: SupabaseLink = {
        id: Date.now(),
        title: title.trim(),
        url: cleanUrl,
        description: description.trim(),
        category: category.trim(),
        icon,
        created_at: new Date().toISOString(),
      };

      setLinks((prev) => [newLink, ...prev]);

      try {
        await supabase.from('links').insert([
          {
            title: title.trim(),
            url: cleanUrl,
            description: description.trim(),
            category: category.trim(),
            icon,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.warn('Supabase insert links fallback:', err);
      }
    }

    try {
      localStorage.setItem('lop_hoc_5b2_links_cache', JSON.stringify(links));
    } catch (e) {
      console.error(e);
    }

    setShowAddModal(false);
  };

  const handleDelete = async (id: string | number) => {
    executeDestructiveAction(
      async () => {
        soundEffects.playClick();
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setDeleteConfirmId(null);

        try {
          await supabase.from('links').delete().eq('id', id);
        } catch (err) {
          console.warn('Supabase delete link fallback:', err);
        }
      },
      {
        actionName: 'xóa liên kết',
        onError: (err) => {
          setDeleteConfirmId(null);
          setErrorMessage(err);
          setTimeout(() => setErrorMessage(null), 4000);
        },
      }
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl text-indigo-700">
            🔗
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                Kho Liên Kết Học Tập Trực Tuyến
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Supabase Live</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Các trang web, học liệu số và công cụ học tập dành cho học sinh và phụ huynh Lớp 5B.2
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLinks}
            disabled={isLoading}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold transition-all cursor-pointer"
            title="Tải lại từ Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {isTeacherLoggedIn && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Liên Kết</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 text-xs font-black cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {links.map((link) => (
          <div
            key={link.id}
            className="group relative bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xl">{link.icon || '🔗'}</span>
                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  {link.category || 'Học Liệu'}
                </span>
              </div>

              <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-indigo-900 line-clamp-1">
                {link.title}
              </h4>

              {link.description && (
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {link.description}
                </p>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <span>Mở liên kết</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              {isTeacherLoggedIn && (
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(link)}
                    title="Sửa liên kết"
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === link.id ? (
                    <div className="flex items-center space-x-1 animate-in fade-in">
                      <span className="text-[10px] text-rose-600 font-bold">Xóa?</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(link.id!);
                        }}
                        className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black cursor-pointer shadow-xs"
                      >
                        Có
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Không
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(link.id!);
                      }}
                      title="Xóa liên kết"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-indigo-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingLink ? 'Chỉnh Sửa Liên Kết' : 'Thêm Liên Kết Mới'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu Đề Liên Kết *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Cổng Thi Trực Tuyến Trạng Nguyên Nhí"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đường Dẫn URL (Web link) *
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Danh Mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="Học Liệu Số">Học Liệu Số</option>
                    <option value="Luyện Tập">Luyện Tập</option>
                    <option value="Trò Chơi">Trò Chơi</option>
                    <option value="Thi Trực Tuyến">Thi Trực Tuyến</option>
                    <option value="Kỹ Năng">Kỹ Năng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Biểu Tượng (Icon)
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="📚">📚 Sách</option>
                    <option value="📐">📐 Toán</option>
                    <option value="🎮">🎮 Game</option>
                    <option value="🌟">🌟 Sao</option>
                    <option value="🎓">🎓 Mũ</option>
                    <option value="🔗">🔗 Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô Tả Ngắn
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung của trang web..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingLink ? 'Lưu' : 'Thêm Vào Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SupabaseLinksManager;
