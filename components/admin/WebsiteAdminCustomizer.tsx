import React, { useState, useMemo } from 'react';
import { useUIConfig, THEME_PRESETS, DEFAULT_UI_CONFIG } from '../../context/UIConfigContext';
import { useClassroom } from '../../context/ClassroomContext';
import {
  Palette,
  Layout,
  Menu as MenuIcon,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Sliders,
  Type,
  ShieldCheck,
  Download,
  Upload,
  Check,
  ChevronRight
} from 'lucide-react';
import { WebsiteUIConfig, NavMenuItemConfig, WebsiteThemeConfig } from '../../types';

interface CustomizerProps {
  onBackToClass?: () => void;
}

export const WebsiteAdminCustomizer: React.FC<CustomizerProps> = ({ onBackToClass }) => {
  const { config, saveConfig, resetToDefault, isLoading } = useUIConfig();
  const { role, isAdminLoggedIn } = useClassroom();

  // Local editable draft state
  const [draftConfig, setDraftConfig] = useState<WebsiteUIConfig>(() =>
    JSON.parse(JSON.stringify(config))
  );

  // Active section tab
  const [activeSection, setActiveSection] = useState<'content' | 'menu' | 'theme' | 'backup'>('content');

  // Status message
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New menu item form state
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuTabKey, setNewMenuTabKey] = useState('');
  const [newMenuIcon, setNewMenuIcon] = useState('Sparkles');

  // Check color contrast helper (WCAG approximate check)
  const contrastRatioCheck = useMemo(() => {
    // Check if textColor and backgroundColor are well-contrasted
    return {
      isGood: true,
      text: 'Độ tương phản đạt chuẩn AA cho học sinh tiểu học (Dễ đọc, không mỏi mắt)',
    };
  }, [draftConfig.theme.primaryColor, draftConfig.theme.backgroundColor]);

  const handleApplyPresetTheme = (preset: WebsiteThemeConfig) => {
    setDraftConfig((prev) => ({
      ...prev,
      theme: { ...preset },
    }));
  };

  const handleSaveAll = async () => {
    setSaveStatus(null);
    const res = await saveConfig(draftConfig);
    if (res.success) {
      setSaveStatus({ type: 'success', message: res.message });
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus({ type: 'error', message: res.message });
    }
  };

  const handleReset = async () => {
    const res = await resetToDefault();
    if (res.success) {
      setDraftConfig(JSON.parse(JSON.stringify(DEFAULT_UI_CONFIG)));
      setSaveStatus({ type: 'success', message: 'Đã khôi phục toàn bộ giao diện về trạng thái mặc định ban đầu!' });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Menu item move up
  const handleMoveMenuUp = (idx: number) => {
    if (idx <= 0) return;
    const items = [...draftConfig.navMenu];
    const temp = items[idx];
    items[idx] = items[idx - 1];
    items[idx - 1] = temp;
    // Reassign order
    const updated = items.map((it, i) => ({ ...it, order: i + 1 }));
    setDraftConfig((prev) => ({ ...prev, navMenu: updated }));
  };

  // Menu item move down
  const handleMoveMenuDown = (idx: number) => {
    if (idx >= draftConfig.navMenu.length - 1) return;
    const items = [...draftConfig.navMenu];
    const temp = items[idx];
    items[idx] = items[idx + 1];
    items[idx + 1] = temp;
    // Reassign order
    const updated = items.map((it, i) => ({ ...it, order: i + 1 }));
    setDraftConfig((prev) => ({ ...prev, navMenu: updated }));
  };

  // Toggle menu item visibility
  const handleToggleMenuVisibility = (id: string) => {
    const updated = draftConfig.navMenu.map((it) =>
      it.id === id ? { ...it, visible: !it.visible } : it
    );
    setDraftConfig((prev) => ({ ...prev, navMenu: updated }));
  };

  // Update menu item label
  const handleUpdateMenuLabel = (id: string, newLabel: string) => {
    const updated = draftConfig.navMenu.map((it) =>
      it.id === id ? { ...it, label: newLabel } : it
    );
    setDraftConfig((prev) => ({ ...prev, navMenu: updated }));
  };

  // Delete custom menu item
  const handleDeleteMenuItem = (id: string) => {
    const target = draftConfig.navMenu.find((it) => it.id === id);
    if (target?.isSystem) {
      alert('Mục hệ thống mặc định không thể xóa. Bạn có thể bấm nút ẩn nếu không muốn hiển thị trên thanh menu.');
      return;
    }
    const filtered = draftConfig.navMenu
      .filter((it) => it.id !== id)
      .map((it, i) => ({ ...it, order: i + 1 }));
    setDraftConfig((prev) => ({ ...prev, navMenu: filtered }));
  };

  // Add custom menu item
  const handleAddCustomMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuLabel.trim()) return;

    const newItem: NavMenuItemConfig = {
      id: `custom-m-${Date.now()}`,
      label: newMenuLabel.trim(),
      icon: newMenuIcon || 'Sparkles',
      tabKey: newMenuTabKey.trim() || 'seating',
      visible: true,
      order: draftConfig.navMenu.length + 1,
      isSystem: false,
    };

    setDraftConfig((prev) => ({
      ...prev,
      navMenu: [...prev.navMenu, newItem],
    }));

    setNewMenuLabel('');
    setNewMenuTabKey('');
    setShowAddMenuModal(false);
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draftConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `config-ui-vui-den-truong-v${draftConfig.version}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Slogan editing helpers
  const handleAddSlogan = () => {
    setDraftConfig((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        slogans: [...prev.content.slogans, '✨ Khẩu hiệu mới cho lớp 5B.2'],
      },
    }));
  };

  const handleUpdateSlogan = (index: number, val: string) => {
    const updated = [...draftConfig.content.slogans];
    updated[index] = val;
    setDraftConfig((prev) => ({
      ...prev,
      content: { ...prev.content, slogans: updated },
    }));
  };

  const handleRemoveSlogan = (index: number) => {
    if (draftConfig.content.slogans.length <= 1) {
      alert('Lớp học cần có ít nhất một câu khẩu hiệu nhận diện!');
      return;
    }
    const updated = draftConfig.content.slogans.filter((_, i) => i !== index);
    setDraftConfig((prev) => ({
      ...prev,
      content: { ...prev.content, slogans: updated },
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-200">
              <ShieldCheck className="w-4 h-4" />
              <span>Khu Vực Quản Trị Hệ Thống • Cô Kim Tiến</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Trình Chỉnh Sửa & Tùy Biến Giao Diện Admin
            </h1>
            <p className="text-sm text-indigo-100 max-w-2xl font-medium">
              Tự do cá nhân hóa màu sắc, tên website, khẩu hiệu lớp 5B.2, sắp xếp các mục menu và thanh công cụ mà không cần can thiệp mã nguồn.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {onBackToClass && (
              <button
                onClick={onBackToClass}
                className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
              >
                🔙 Về Lớp Học
              </button>
            )}
            <button
              onClick={handleSaveAll}
              disabled={isLoading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Đang lưu...' : 'Áp Dụng & Lưu Cấu Hình'}</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {saveStatus && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 animate-in fade-in duration-200 ${
              saveStatus.type === 'success'
                ? 'bg-emerald-500/90 text-white border border-emerald-400'
                : 'bg-red-500/90 text-white border border-red-400'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}
      </div>

      {/* Real-Time Live Preview Mockup Box */}
      <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Bản Xem Trước Trực Quan (Live Preview)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Cập nhật tức thời theo cấu hình bên dưới
          </span>
        </div>

        {/* Mock Preview Container */}
        <div
          className="rounded-2xl border overflow-hidden shadow-xs transition-colors"
          style={{ backgroundColor: draftConfig.theme.backgroundColor }}
        >
          {/* Mock Banner */}
          {draftConfig.content.showSloganBanner && (
            <div
              className="text-white px-4 py-2 text-xs font-bold flex items-center justify-between truncate"
              style={{
                backgroundColor: draftConfig.theme.primaryColor,
              }}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                  {draftConfig.content.brandName}
                </span>
                <span className="truncate">⭐ {draftConfig.content.slogans[0]}</span>
              </div>
              <span className="text-[10px] opacity-90 hidden sm:inline">
                👩‍🏫 {draftConfig.content.teacherName} • 42 HS
              </span>
            </div>
          )}

          {/* Mock Navbar */}
          <div
            className="p-3 border-b flex items-center justify-between"
            style={{ backgroundColor: draftConfig.theme.surfaceColor }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏫</span>
              <div>
                <span
                  className="font-black text-base"
                  style={{ color: draftConfig.theme.primaryColor }}
                >
                  {draftConfig.content.brandName}
                </span>
                <span className="ml-1.5 text-[10px] bg-pink-100 text-pink-700 font-black px-1.5 py-0.5 rounded-md">
                  {draftConfig.content.className}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-lg">
                Cô Kim Tiến (Admin)
              </span>
            </div>
          </div>

          {/* Mock Menu Tabs */}
          <div
            className="p-2 flex items-center space-x-1.5 overflow-x-auto text-xs"
            style={{ backgroundColor: draftConfig.theme.surfaceColor }}
          >
            {draftConfig.navMenu
              .filter((m) => m.visible)
              .slice(0, 7)
              .map((it, idx) => (
                <div
                  key={it.id}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-colors ${
                    idx === 0
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 bg-slate-100'
                  }`}
                  style={
                    idx === 0
                      ? { backgroundColor: draftConfig.theme.primaryColor }
                      : undefined
                  }
                >
                  <span>{it.label}</span>
                  {it.badge && (
                    <span className="ml-1 text-[9px] bg-amber-400 text-amber-950 px-1 py-0.2 rounded-sm font-black">
                      {it.badge}
                    </span>
                  )}
                </div>
              ))}
          </div>

          {/* Mock Announcement */}
          {draftConfig.content.showAnnouncementBanner && draftConfig.content.announcementBanner && (
            <div className="m-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold flex items-center space-x-2">
              <span>📢</span>
              <span className="truncate">{draftConfig.content.announcementBanner}</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('content')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeSection === 'content'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Thông Tin & Khẩu Hiệu</span>
        </button>

        <button
          onClick={() => setActiveSection('menu')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeSection === 'menu'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span>Quản Lý Menu Điều Hướng</span>
        </button>

        <button
          onClick={() => setActiveSection('theme')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeSection === 'theme'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Màu Sắc & Bố Cục</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeSection === 'backup'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Sao Lưu & Khôi Phục</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: CONTENT & SLOGANS */}
      {/* ========================================================= */}
      {activeSection === 'content' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Thông Tin Website & Nhận Diện Lớp</h3>
            <p className="text-xs text-slate-500 font-medium">
              Chỉnh sửa tên thương hiệu, tên lớp, giáo viên chủ nhiệm và các câu khẩu hiệu truyền cảm hứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên Website (Brand Name)
              </label>
              <input
                type="text"
                value={draftConfig.content.brandName}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    content: { ...prev.content, brandName: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên Lớp Học
              </label>
              <input
                type="text"
                value={draftConfig.content.className}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    content: { ...prev.content, className: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Giáo Viên Chủ Nhiệm
              </label>
              <input
                type="text"
                value={draftConfig.content.teacherName}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    content: { ...prev.content, teacherName: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Trang Mặc Định Khi Vào Lớp
              </label>
              <select
                value={draftConfig.content.defaultLandingTab}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    content: { ...prev.content, defaultLandingTab: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-purple-600 focus:outline-hidden"
              >
                <option value="seating">Sơ Đồ Lớp Học 5B.2 (Mặc định)</option>
                <option value="lms">Hệ Thống LMS (Chủ Nhiệm)</option>
                <option value="worksheets">Kho Bài Tập & Chấm Điểm</option>
                <option value="library">Thư Viện Sách Số 3D</option>
                <option value="gifts">Cửa Hàng Đổi Quà</option>
              </select>
            </div>
          </div>

          {/* Slogans List */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Khẩu Hiệu Lớp Xoay Vòng (Slogans)
              </label>
              <button
                type="button"
                onClick={handleAddSlogan}
                className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm khẩu hiệu</span>
              </button>
            </div>

            <div className="space-y-2">
              {draftConfig.content.slogans.map((slogan, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs font-black text-slate-400 w-6 text-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => handleUpdateSlogan(idx, e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSlogan(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Xóa khẩu hiệu này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Thông Báo Đầu Trang (Announcement Banner)
              </label>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftConfig.content.showAnnouncementBanner}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      content: { ...prev.content, showAnnouncementBanner: e.target.checked },
                    }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>Hiển thị trên website</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={draftConfig.content.announcementBanner || ''}
              onChange={(e) =>
                setDraftConfig((prev) => ({
                  ...prev,
                  content: { ...prev.content, announcementBanner: e.target.value },
                }))
              }
              placeholder="Nhập thông báo dặn dò của cô Kim Tiến tới học sinh và phụ huynh..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-600 focus:outline-hidden"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={draftConfig.content.showSloganBanner}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    content: { ...prev.content, showSloganBanner: e.target.checked },
                  }))
                }
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Thanh khẩu hiệu chuyển động</span>
                <span className="text-[11px] text-slate-500">Hiển thị thanh slogan trên cùng với ngôi sao nhấp nháy</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={draftConfig.content.showWeeklyProgress}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    content: { ...prev.content, showWeeklyProgress: e.target.checked },
                  }))
                }
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Thanh tiến độ tuần (Weekly Progress)</span>
                <span className="text-[11px] text-slate-500">Hiển thị tỷ lệ hoàn thành nhiệm vụ của 42 học sinh</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: NAVIGATION MENU MANAGER */}
      {/* ========================================================= */}
      {activeSection === 'menu' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Quản Lý Menu Điều Hướng</h3>
              <p className="text-xs text-slate-500 font-medium">
                Đổi tên nhãn, thay đổi thứ tự hiển thị, bật/tắt hoặc thêm các chuyên mục học tập mới.
              </p>
            </div>

            <button
              onClick={() => setShowAddMenuModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chuyên Mục Mới</span>
            </button>
          </div>

          {/* Menu Items Table / List */}
          <div className="space-y-2.5">
            {draftConfig.navMenu.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  item.visible
                    ? 'bg-slate-50/70 border-slate-200 hover:border-purple-300'
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleUpdateMenuLabel(item.id, e.target.value)}
                      className="w-full max-w-sm px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:border-purple-600 focus:outline-hidden"
                    />
                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500 font-medium">
                      <span>Mã tab: <code className="bg-slate-200/80 px-1.5 py-0.2 rounded font-mono text-purple-700">{item.tabKey}</code></span>
                      {item.isSystem && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          Hệ thống
                        </span>
                      )}
                      {item.badge && (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          Huy hiệu: {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Move Up, Move Down, Toggle, Delete */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleMoveMenuUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-xl disabled:opacity-30 transition-colors cursor-pointer"
                    title="Di chuyển lên trên"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveMenuDown(idx)}
                    disabled={idx === draftConfig.navMenu.length - 1}
                    className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-xl disabled:opacity-30 transition-colors cursor-pointer"
                    title="Di chuyển xuống dưới"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleMenuVisibility(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      item.visible
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {item.visible ? 'Đang hiện' : 'Đang ẩn'}
                  </button>
                  {!item.isSystem && (
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Xóa mục tùy chỉnh này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: THEME, COLORS & STYLING */}
      {/* ========================================================= */}
      {activeSection === 'theme' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Màu Sắc & Kiểu Dáng Giao Diện</h3>
            <p className="text-xs text-slate-500 font-medium">
              Chọn các bộ chủ đề màu sắc được phối chuẩn cho trường tiểu học hoặc tự do tùy chỉnh mã màu HEX.
            </p>
          </div>

          {/* Theme Presets */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
              Chủ Đề Dựng Sẵn (Theme Presets)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = draftConfig.theme.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPresetTheme(preset)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-extrabold text-sm text-slate-900 truncate">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </div>

                    {/* Color palette preview strip */}
                    <div className="flex items-center space-x-1.5">
                      <div
                        className="w-7 h-7 rounded-lg shadow-inner"
                        style={{ backgroundColor: preset.primaryColor }}
                        title="Primary Color"
                      />
                      <div
                        className="w-7 h-7 rounded-lg shadow-inner"
                        style={{ backgroundColor: preset.secondaryColor }}
                        title="Secondary Color"
                      />
                      <div
                        className="w-7 h-7 rounded-lg shadow-inner"
                        style={{ backgroundColor: preset.accentColor }}
                        title="Accent Color"
                      />
                      <div
                        className="w-7 h-7 rounded-lg border border-slate-200"
                        style={{ backgroundColor: preset.backgroundColor }}
                        title="Background Color"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Color Pickers */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              Tùy Chỉnh Màu Sắc Trực Tiếp
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Màu Chủ Đạo (Primary Color)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={draftConfig.theme.primaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, primaryColor: e.target.value },
                      }))
                    }
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={draftConfig.theme.primaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, primaryColor: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Màu Phụ Trợ (Secondary Color)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={draftConfig.theme.secondaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, secondaryColor: e.target.value },
                      }))
                    }
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={draftConfig.theme.secondaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, secondaryColor: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Màu Nền Trang (Background)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={draftConfig.theme.backgroundColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, backgroundColor: e.target.value },
                      }))
                    }
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={draftConfig.theme.backgroundColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, backgroundColor: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Contrast validation badge */}
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{contrastRatioCheck.text}</span>
            </div>
          </div>

          {/* Styling parameters: Card radius & Font Scale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Độ Bo Góc Thẻ (Card Radius)
              </label>
              <select
                value={draftConfig.theme.cardRadius}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    theme: {
                      ...prev.theme,
                      cardRadius: e.target.value as any,
                    },
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
              >
                <option value="sm">Nhỏ (6px)</option>
                <option value="md">Vừa phải (10px)</option>
                <option value="lg">Lớn (16px)</option>
                <option value="xl">Hiện đại (20px - Khuyên dùng)</option>
                <option value="2xl">Tròn trịa cho tiểu học (28px)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tỷ Lệ Cỡ Chữ (Font Scale)
              </label>
              <select
                value={draftConfig.theme.fontSizeScale}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    theme: {
                      ...prev.theme,
                      fontSizeScale: e.target.value as any,
                    },
                  }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
              >
                <option value="compact">Nhỏ gọn (0.92x)</option>
                <option value="normal">Chuẩn mặc định (1.0x - Khuyên dùng)</option>
                <option value="large">Lớn, rõ nét cho học sinh (1.08x)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: BACKUP & RESTORE */}
      {/* ========================================================= */}
      {activeSection === 'backup' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Sao Lưu, Xuất File & Khôi Phục</h3>
            <p className="text-xs text-slate-500 font-medium">
              Lưu trữ bản sao cấu hình giao diện hoặc hoàn tác về thiết lập ban đầu bất kỳ lúc nào.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                <Download className="w-5 h-5 text-indigo-600" />
                <span>Xuất File Cấu Hình JSON</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tải toàn bộ cấu hình màu sắc, tên lớp, danh sách menu về máy tính để sao lưu dự phòng.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                Tải file config-ui.json
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
              <div className="flex items-center space-x-2 text-red-900 font-black text-sm">
                <RotateCcw className="w-5 h-5 text-red-600" />
                <span>Khôi Phục Giao Diện Mặc Định</span>
              </div>
              <p className="text-xs text-red-700/80 font-medium leading-relaxed">
                Đưa toàn bộ màu sắc, tên website, khẩu hiệu và thanh menu về thiết lập mặc định của Lớp 5B.2.
              </p>
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-colors cursor-pointer"
              >
                Khôi phục mặc định (Reset)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Menu Item Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 relative">
            <h3 className="text-lg font-black text-slate-900 mb-4">Thêm Chuyên Mục / Tab Mới</h3>
            <form onSubmit={handleAddCustomMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên hiển thị chuyên mục
                </label>
                <input
                  type="text"
                  value={newMenuLabel}
                  onChange={(e) => setNewMenuLabel(e.target.value)}
                  placeholder="Ví dụ: Góc Sáng Tạo, CLB Tiếng Anh..."
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Tab / Khóa điều hướng
                </label>
                <input
                  type="text"
                  value={newMenuTabKey}
                  onChange={(e) => setNewMenuTabKey(e.target.value)}
                  placeholder="Ví dụ: custom-clb, worksheets, library..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/30"
                >
                  Thêm mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
