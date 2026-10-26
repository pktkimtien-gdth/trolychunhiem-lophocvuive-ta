import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { useUIConfig } from '../context/UIConfigContext';
import { soundEffects } from '../utils/soundEffects';
import {
  Sparkles,
  Award,
  Users,
  GraduationCap,
  Gift,
  Clock,
  Camera,
  LayoutGrid,
  BookOpen,
  LogOut,
  ShieldCheck,
  UserCheck,
  UploadCloud,
  Volume2,
  VolumeX,
  Mic,
  Compass,
  Tv,
  FolderPlus,
  LayoutDashboard,
  Library,
  KeyRound,
  Sliders,
  RefreshCw,
  User,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Globe,
  ExternalLink
} from 'lucide-react';
import { ChangeAdminPinModal } from './ChangeAdminPinModal';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenStudentLogin: () => void;
  onOpenTeacherLogin: () => void;
  onOpenParentLogin: () => void;
  onOpenFileManager: () => void;
  onOpenUploadMedia?: () => void;
}

// Icon dictionary for dynamic menu rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  LayoutGrid,
  BookOpen,
  Gift,
  Clock,
  Camera,
  Award,
  Tv,
  Library,
  Sparkles,
  Users,
  Heart,
  Bookmark,
  Globe,
  ExternalLink,
};

// Vibrant icon color map when tab is inactive
const ICON_COLOR_MAP: Record<string, string> = {
  LayoutDashboard: 'text-blue-600',
  LayoutGrid: 'text-indigo-600',
  BookOpen: 'text-blue-600',
  Gift: 'text-pink-500',
  Clock: 'text-amber-500',
  Camera: 'text-cyan-500',
  Award: 'text-yellow-500',
  Tv: 'text-rose-500',
  Library: 'text-amber-600',
  Sparkles: 'text-amber-400',
  Users: 'text-emerald-600',
  Bookmark: 'text-teal-600',
  Globe: 'text-sky-600',
  ExternalLink: 'text-indigo-600',
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenStudentLogin,
  onOpenTeacherLogin,
  onOpenParentLogin,
  onOpenFileManager,
  onOpenUploadMedia,
}) => {
  const {
    role,
    currentUser,
    currentStudent,
    logout,
    switchAccount,
    isAdminLoggedIn,
    isTeacherLoggedIn,
    students,
  } = useClassroom();

  const { content, navMenu } = useUIConfig();

  const slogans = content.slogans?.length > 0 ? content.slogans : [
    'Mỗi ngày đến lớp – Mỗi ngày một niềm vui!',
    '🌈 Học tập tích cực • Sáng tạo mỗi ngày • Yêu thương và sẻ chia',
    '✨ Cùng học tập – Cùng tiến bộ – Cùng tỏa sáng!'
  ];

  const [sloganIdx, setSloganIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(() => soundEffects.isEnabled());
  const [showChangePin, setShowChangePin] = useState(false);
  const { isOnline } = useOnlineStatus();

  // Scroll references for navigation bars (enables smooth sliding across all devices)
  const navScrollRef = useRef<HTMLElement | null>(null);
  const categoriesScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      navScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const offset = direction === 'left' ? -200 : 200;
      categoriesScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSloganIdx((prev) => (prev + 1) % slogans.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slogans.length]);

  const handleToggleSound = () => {
    const next = soundEffects.toggle();
    setSoundOn(next);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSwitchAccount = () => {
    switchAccount();
  };

  // Tính số lượng con được liên kết với phụ huynh này; nếu <= 1 con thì ẩn nút chuyển hồ sơ
  const parentLinkedStudentsCount = React.useMemo(() => {
    if (role !== 'parent' || !currentStudent) return 0;
    if (currentStudent.parentPin && currentStudent.parentPin.trim().length > 0) {
      return students.filter(
        (s) => s.parentPin && s.parentPin.trim() === currentStudent.parentPin?.trim()
      ).length;
    }
    return 1;
  }, [role, currentStudent, students]);

  // Visible menu items ordered
  const visibleMenuItems = navMenu.filter((m) => m.visible);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-xs">
      {/* Top Banner: Vui đến trường (if enabled) */}
      {content.showSloganBanner && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between">
          <div
            onClick={() => setSloganIdx((prev) => (prev + 1) % slogans.length)}
            className="flex items-center space-x-2 truncate cursor-pointer hover:opacity-90 transition-opacity"
            title="Bấm để đổi khẩu hiệu nhận diện"
          >
            <span className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
              {content.brandName || 'Vui Đến Trường'}
            </span>
            <span className="truncate font-black text-amber-200">
              ⭐ {slogans[sloganIdx]}
            </span>
            <span className="text-[10px] text-white/80 bg-white/20 px-1.5 py-0.5 rounded-md hidden sm:inline font-bold">
              Đổi
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-3 text-xs text-white/95 shrink-0">
            <span className="font-extrabold text-amber-200">
              👩‍🏫 GVCN: {content.teacherName || 'Cô Kim Tiến'}
            </span>
            <span>•</span>
            <span className="font-bold">👧👦 Sĩ số: 42 học sinh</span>
            <span>•</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
              🏆 {content.className || 'Lớp 5B.2'}
            </span>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand: Vui Đến Trường */}
          <div
            onClick={() => setActiveTab(content.defaultLandingTab || 'seating')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-pink-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <span className="text-2xl">🏫</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
                  {content.brandName || 'Vui Đến Trường'}
                </span>
                <span className="bg-pink-100 text-pink-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                  {content.className || '5B.2 Vui Vẻ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                {content.subSlogan || 'Nơi tri thức là niềm vui • GVCN: Cô Kim Tiến Number Hi!'}
              </p>
            </div>
          </div>

          {/* User Account Area (Top-Right Indicator) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* 1. Student Logged In */}
            {role === 'student' && currentStudent ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-1.5 sm:px-3 sm:py-1.5 shadow-xs">
                <img
                  src={currentStudent.avatar}
                  alt={currentStudent.name}
                  className="w-8 h-8 rounded-full border border-amber-300 bg-white shadow-xs"
                />
                <div className="text-left hidden xs:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                    <span className="truncate max-w-[110px]">{currentStudent.name}</span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-black">
                      Học sinh
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-bold">
                    <span className="text-amber-600">🪙 {currentStudent.coins} xu</span>
                    <span className="text-purple-600">⭐ {currentStudent.stars}</span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex items-center space-x-1 ml-1">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="Xem Lời nhắn truyền cảm hứng hôm nay"
                    className="hidden md:flex items-center space-x-1 text-[11px] bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-black px-2 py-1 rounded-xl shadow-xs hover:from-amber-300 hover:to-orange-300 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-950" />
                    <span>Lời nhắn</span>
                  </button>
                  <button
                    onClick={handleSwitchAccount}
                    title="Đổi sang tài khoản học sinh khác"
                    className="text-[11px] bg-white text-slate-700 hover:text-amber-700 hover:bg-amber-100/60 border border-slate-200 px-2 py-1 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Đổi bạn
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất khỏi tài khoản"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    aria-label="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (role === 'admin' || role === 'teacher') && isTeacherLoggedIn ? (
              /* 2. Admin / Teacher Logged In */
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-purple-50 border border-purple-200 rounded-2xl px-2.5 py-1.5 sm:px-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  K
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-purple-900 flex items-center space-x-1">
                    <span>Cô Kim Tiến</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="text-[10px] text-purple-700 font-bold flex items-center space-x-1">
                    <span className="bg-purple-200/80 text-purple-900 px-1 py-0.2 rounded">
                      {role === 'admin' ? 'Quản trị viên (Admin)' : 'Giáo viên'}
                    </span>
                  </div>
                </div>

                {/* Admin Customizer Quick Trigger */}
                {role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('admin-customizer')}
                    title="Mở Trình Quản Trị Website & Giao Diện"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                      activeTab === 'admin-customizer'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Quản trị</span>
                  </button>
                )}

                <button
                  onClick={() => setShowChangePin(true)}
                  title="Đổi mã PIN Quản Trị Viên"
                  className="p-1.5 text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                  aria-label="Đổi mã PIN Quản Trị Viên"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSwitchAccount}
                  title="Chuyển đổi sang tài khoản khác"
                  className="p-1.5 text-purple-700 hover:text-indigo-700 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer hidden sm:block"
                  aria-label="Chuyển đổi tài khoản"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="p-1.5 text-purple-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : role === 'parent' ? (
              /* 3. Parent Logged In - Respectful Terminology */
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-2.5 py-1.5 sm:px-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  👨‍👩‍👧
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-emerald-900 truncate max-w-[170px]">
                    Phụ huynh của học sinh: {currentStudent?.name || ''}
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded font-black">
                    Phụ huynh • Lớp 5B.2
                  </span>
                </div>

                {parentLinkedStudentsCount > 1 && (
                  <button
                    onClick={onOpenParentLogin}
                    title="Chuyển sang xem hồ sơ học sinh khác trong gia đình"
                    className="text-[11px] bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Chuyển hồ sơ ({parentLinkedStudentsCount})
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Unauthenticated Quick Login Buttons */
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={onOpenStudentLogin}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Em vào lớp học</span>
                </button>
                <button
                  onClick={onOpenTeacherLogin}
                  className="flex items-center space-x-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Giáo viên</span>
                </button>
                <button
                  onClick={onOpenParentLogin}
                  className="flex items-center space-x-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden md:inline">Phụ huynh</span>
                </button>
              </div>
            )}

            {/* PWA Offline Install Button */}
            <PWAInstallButton />

            {/* Online/Offline Status Indicator */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
              }`}
              title={
                isOnline
                  ? 'Hệ thống đang trực tuyến (Online) - Đồng bộ tức thời'
                  : 'Đang ở chế độ ngoại tuyến (Offline) - Bảng điểm và bài tập vẫn hoạt động bình thường'
              }
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1 transition-all ${
                soundOn
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundOn ? 'Hiệu ứng âm thanh: ĐANG BẬT (Bấm để tắt)' : 'Hiệu ứng âm thanh: ĐANG TẮT (Bấm để bật)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden lg:inline text-[11px]">{soundOn ? 'Âm thanh' : 'Tắt tiếng'}</span>
            </button>

            {/* Voice Command Navigation Trigger */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-voice-command'))}
              className="p-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Điều khiển bằng giọng nói: Nói 'Sơ đồ lớp', 'Phiếu bài tập', 'Cửa hàng'..."
            >
              <Mic className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span className="hidden lg:inline text-[11px] font-black">Giọng nói</span>
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs Bar with visible smooth scrollbar & slider buttons */}
        <div className="relative mt-3 flex items-center group/nav">
          <button
            type="button"
            onClick={() => scrollNav('left')}
            className="p-1.5 rounded-xl bg-white shadow-md border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 mr-1 shrink-0 z-10 transition-all cursor-pointer"
            title="Cuộn menu sang trái"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <nav
            ref={navScrollRef}
            className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 scroll-smooth text-xs sm:text-sm scrollbar-thin scrollbar-thumb-indigo-300 hover:scrollbar-thumb-indigo-500 scrollbar-track-slate-100 w-full"
          >
          {/* Admin Customizer Tab */}
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin-customizer')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-black whitespace-nowrap transition-all ${
                activeTab === 'admin-customizer'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/30 scale-[1.02]'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-300" />
              <span>Quản Trị Giao Diện</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                ADMIN
              </span>
            </button>
          )}

          {/* Dynamic Menu Items with rich individual styling */}
          {visibleMenuItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Sparkles;
            const isActive = activeTab === item.tabKey;
            const isSpecialLms = item.tabKey === 'lms';
            const isVideo = item.tabKey === 'video-library';
            const isLibrary = item.tabKey === 'library';
            const isContest = item.tabKey === 'contest';

            // Resolve button style
            let btnClass = 'text-slate-700 hover:bg-slate-100';
            if (isActive) {
              if (isSpecialLms) {
                btnClass = 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]';
              } else if (isVideo) {
                btnClass = 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 text-white shadow-md shadow-pink-600/25 scale-[1.02]';
              } else if (isLibrary) {
                btnClass = 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md shadow-amber-700/25 scale-[1.02]';
              } else if (isContest) {
                btnClass = 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]';
              } else {
                btnClass = 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]';
              }
            } else {
              if (isSpecialLms) {
                btnClass = 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 font-black';
              } else if (isContest) {
                btnClass = 'text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-amber-200/50';
              } else if (isLibrary) {
                btnClass = 'text-slate-700 hover:bg-amber-50 hover:text-amber-900';
              } else if (isVideo) {
                btnClass = 'text-slate-700 hover:bg-pink-50 hover:text-pink-700';
              }
            }

            // Resolve icon color
            const iconClass = isActive
              ? 'text-white'
              : ICON_COLOR_MAP[item.icon] || 'text-indigo-600';

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.tabKey)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${btnClass}`}
              >
                <IconComponent className={`w-4 h-4 ${iconClass}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      item.badge === 'HOT'
                        ? 'bg-red-500 text-white animate-pulse'
                        : item.badge === 'AI'
                        ? 'bg-cyan-500 text-white'
                        : item.badge === 'TKB'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-amber-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Teacher Upload Media */}
          {(role === 'teacher' || role === 'admin') && onOpenUploadMedia && (
            <button
              onClick={onOpenUploadMedia}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 active:scale-95 cursor-pointer"
              title="Tải lên hình ảnh và video lớp học"
            >
              <FolderPlus className="w-4 h-4 text-pink-600" />
              <span>Tải Video/Ảnh Lớp</span>
            </button>
          )}

          {/* Teacher File Management */}
          {(role === 'teacher' || role === 'admin') && (
            <button
              onClick={onOpenFileManager}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-black whitespace-nowrap transition-all bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
              title="Thêm file danh sách 42 học sinh và file bài tập cuối tuần"
            >
              <UploadCloud className="w-4 h-4 text-amber-300" />
              <span>📁 Thêm File DS 42 HS & Bài Tập</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                Cô Kim Tiến
              </span>
            </button>
          )}
          </nav>

          <button
            type="button"
            onClick={() => scrollNav('right')}
            className="p-1.5 rounded-xl bg-white shadow-md border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 ml-1 shrink-0 z-10 transition-all cursor-pointer"
            title="Cuộn menu sang phải"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Chuyên Mục Khuyến Nghị Vui Đến Trường with visible scrollbar & Quả Lắc Gọi Tên */}
        <div className="relative flex items-center pt-2 mt-2 border-t border-slate-100 group/cat">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 mr-1 shrink-0 transition-all cursor-pointer"
            title="Cuộn sang trái"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={categoriesScrollRef}
            className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 text-[11px] font-bold text-slate-600 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-50 w-full scroll-smooth"
          >
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 shrink-0 mr-1 flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chuyên mục:</span>
            </span>

            <button
              onClick={() => setActiveTab('seating')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'seating'
                  ? 'bg-indigo-100 text-indigo-900 font-black shadow-2xs border border-indigo-200'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Trạm 5B.2 (Góc Hạnh Phúc): Không gian dành riêng cho lớp, nơi cập nhật nhanh chóng các thông báo gửi phụ huynh, thời khóa biểu và những khoảnh khắc đáng yêu của các em trên lớp"
            >
              <span>🏡 Trạm 5B.2 (Góc Hạnh Phúc)</span>
            </button>

            <button
              onClick={() => setActiveTab('picker')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'picker'
                  ? 'bg-amber-100 text-amber-900 font-black shadow-2xs border border-amber-300 scale-[1.02]'
                  : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold'
              }`}
              title="Đồng hồ quả lắc gọi tên & điểm danh ngẫu nhiên công bằng"
            >
              <span>⏰ Quả Lắc Gọi Tên</span>
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                HOT
              </span>
            </button>

            <button
              onClick={() => setActiveTab('worksheets')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'worksheets'
                  ? 'bg-purple-100 text-purple-900 font-black shadow-2xs border border-purple-200'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Thử Thách Vui (Tự chủ học tập): Chuyên mục ôn tập tương tác và phiếu bài tập điện tử"
            >
              <span>🎯 Thử Thách Vui (Tự chủ học tập)</span>
            </button>

            <button
              onClick={() => setActiveTab('camera-ai')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'camera-ai'
                  ? 'bg-pink-100 text-pink-900 font-black shadow-2xs border border-pink-200'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Góc Sáng Tạo (Cuộc sống sắc màu): Trò chơi tương tác Camera AI 3D Pixar"
            >
              <span>🎨 Góc Sáng Tạo (Cuộc sống sắc màu)</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-100 text-emerald-900 font-black shadow-2xs border border-emerald-200'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Hành trang tri thức: Sổ điểm, báo cáo và thời khóa biểu lớp học"
            >
              <span>📚 Hành trang tri thức</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 ml-1 shrink-0 transition-all cursor-pointer"
            title="Cuộn sang phải"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ChangeAdminPinModal
        isOpen={showChangePin}
        onClose={() => setShowChangePin(false)}
      />
    </header>
  );
};
