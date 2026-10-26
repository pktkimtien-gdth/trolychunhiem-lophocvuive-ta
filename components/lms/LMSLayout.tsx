import React, { useState } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { LMSOverview } from './LMSOverview';
import { LMSStudentList } from './LMSStudentList';
import { LMSWeeklyAssignment } from './LMSWeeklyAssignment';
import { LMSProgressTracker } from './LMSProgressTracker';
import { LMSReportsExport } from './LMSReportsExport';
import { WeeklyProgressBar } from './WeeklyProgressBar';
import { HighlightedEventAnnouncements } from '../common/HighlightedEventAnnouncements';
import { soundEffects } from '../../utils/soundEffects';
import { PWAInstallButton } from '../PWAInstallButton';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { getAcademicYearInfo, extractUniqueWeeks } from '../../utils/dateUtils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Calendar,
  Grid,
  Tv,
  BookOpen,
  Clock,
  Camera,
  Gift,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Plus,
  ShieldCheck,
  UserCheck,
  Layers,
  GraduationCap,
  Library,
  LogOut,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface LMSLayoutProps {
  onOpenToolkitTab: (tabId: string) => void;
  onOpenStudentLogin: () => void;
  onOpenTeacherLogin: () => void;
  onOpenParentLogin: () => void;
}

export const LMSLayout: React.FC<LMSLayoutProps> = ({
  onOpenToolkitTab,
  onOpenStudentLogin,
  onOpenTeacherLogin,
  onOpenParentLogin,
}) => {
  const {
    role,
    currentStudent,
    isTeacherLoggedIn,
    isAdminLoggedIn,
    logoutTeacher,
    logout,
    switchAccount,
    classTasks,
    students,
  } = useClassroom();

  // Active LMS Module: 'overview' | 'students' | 'assignments' | 'progress' | 'reports'
  const [activeModule, setActiveModule] = useState<
    'overview' | 'students' | 'assignments' | 'progress' | 'reports'
  >('overview');

  // Shared Academic Calendar & Dynamic Current Week Calculation
  const academicInfo = React.useMemo(() => getAcademicYearInfo(), []);
  const [selectedWeek, setSelectedWeek] = useState<string>(() => academicInfo.weekLabel);

  // Dynamically extract unique weeks from classTasks + calculated current week
  const uniqueWeeks = React.useMemo(() => {
    return extractUniqueWeeks(classTasks, academicInfo.weekLabel);
  }, [classTasks, academicInfo.weekLabel]);

  // Navigation filter state pass-through
  const [drilldownFilter, setDrilldownFilter] = useState<{
    filterStatus?: string;
    studentId?: string;
    taskId?: string;
  }>({});

  // Sidebar collapse state: auto-collapse on tablet/laptop (<1200px) to maximize content width
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1200;
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-collapse sidebar when viewport width is below 1200px
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sound effect state
  const [soundOn, setSoundOn] = useState(() => soundEffects.isEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    soundEffects.setEnabled(next);
    setSoundOn(next);
    if (next) soundEffects.playCoin();
  };

  const handleNavigateWithFilters = (module: string, params?: any) => {
    soundEffects.playClick();
    if (params) {
      setDrilldownFilter(params);
    }
    setActiveModule(module as any);
  };

  // Compute pending actions count for badge
  const pendingActionsCount = React.useMemo(() => {
    let count = 0;
    classTasks.forEach((task) => {
      Object.values(task.studentRecords).forEach((rec) => {
        if (rec.status === 'submitted' || rec.status === 'needs_revision') count++;
      });
    });
    return count;
  }, [classTasks]);

  const navItems = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: pendingActionsCount > 0 ? `${pendingActionsCount}` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'students',
      label: 'Danh sách học sinh',
      icon: Users,
      badge: `${students.length}`,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'assignments',
      label: 'Giao bài theo tuần',
      icon: ClipboardList,
      badge: undefined,
    },
    {
      id: 'progress',
      label: 'Theo dõi tiến độ',
      icon: CheckSquare,
      badge: undefined,
    },
    {
      id: 'reports',
      label: 'Báo cáo & Xuất dữ liệu',
      icon: BarChart3,
      badge: 'CSV',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  const toolkitItems = [
    { id: 'seating', label: 'Sơ đồ lớp (4 Dãy 24 Bàn)', icon: Grid },
    { id: 'video-library', label: 'Kho Video Bài Giảng AI', icon: Tv },
    { id: 'library', label: 'Kệ sách & Thư viện số', icon: Library },
    { id: 'worksheets', label: 'Kho bài tập trắc nghiệm', icon: BookOpen },
    { id: 'picker', label: 'Đồng hồ quả lắc & Vòng quay', icon: Clock },
    { id: 'camera-ai', label: 'Trò chơi Camera AI', icon: Camera },
    { id: 'gifts', label: 'Cửa hàng đổi quà', icon: Gift },
    { id: 'links', label: 'Kho liên kết Supabase', icon: BookOpen },
    { id: 'reports-timetable', label: 'Thời khóa biểu tuần', icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-['Quicksand',sans-serif] w-full min-w-0 overflow-x-hidden">
      {/* LEFT SIDEBAR (DESKTOP) */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 z-30 shrink-0 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-20 min-w-20' : 'w-64 min-w-64'
        } overflow-hidden`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20 text-base shrink-0">
                5B.2
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-slate-900 truncate">
                  Trợ Lý Chủ Nhiệm
                </div>
                <div className="text-[11px] text-slate-500 font-semibold truncate">
                  Lớp 5B.2 • Cô Kim Tiến
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm text-sm">
              5B
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Section 1: 5 Phân Hệ LMS Chính */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Hệ Thống LMS Chủ Nhiệm
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveModule(item.id as any);
                  }}
                  className={`w-full flex items-center rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-blue-700' : item.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section 2: Tiện Ích Phòng Học Sư Phạm */}
          <div className="space-y-1 pt-3 border-t border-slate-100">
            {!sidebarCollapsed && (
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Công Cụ Lớp Học</span>
                <span className="text-amber-500 font-bold">Tương tác</span>
              </div>
            )}
            {toolkitItems.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenToolkitTab(tool.id);
                  }}
                  className={`w-full flex items-center rounded-xl font-bold text-xs transition-all ${
                    sidebarCollapsed ? 'justify-center p-2.5' : 'px-3.5 py-2'
                  } text-slate-600 hover:bg-slate-100 hover:text-blue-700`}
                  title={sidebarCollapsed ? tool.label : undefined}
                >
                  <Icon className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{tool.label}</span>}
                </button>
              );
            })}

            {/* Nút bấm ở cuối Sidebar menu */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onOpenToolkitTab('seating');
              }}
              className={`w-full flex items-center rounded-xl font-black text-xs transition-all cursor-pointer ${
                sidebarCollapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5 space-x-3'
              } text-amber-800 bg-amber-50 hover:bg-amber-100/90 border border-amber-300/80 shadow-2xs mt-2`}
              title="🔙 Về Lớp 5B.2"
              aria-label="🔙 Về Lớp 5B.2"
            >
              <span className="text-sm shrink-0">🔙</span>
              {!sidebarCollapsed && <span className="truncate">Về Lớp 5B.2</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer User Info & Account Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
          {!sidebarCollapsed ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    KT
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      Cô Kim Tiến
                    </div>
                    <div className="text-[10px] text-purple-700 font-semibold truncate">
                      {role === 'admin' ? 'Quản trị viên (Admin)' : 'GVCN Lớp 5B.2'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => switchAccount()}
                    title="Đổi tài khoản"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => logout()}
                    title="Đăng xuất"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {role === 'admin' && (
                <button
                  onClick={() => onOpenToolkitTab('admin-customizer')}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>Quản Trị Giao Diện Website</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs" title="Cô Kim Tiến">
                KT
              </div>
              <button
                onClick={() => logout()}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Prominent Back to Classroom Button at Very Bottom of Sidebar */}
        <div className="p-3 border-t border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-orange-50/90">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenToolkitTab('seating');
            }}
            className={`w-full py-3 px-3 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:via-orange-600 hover:to-pink-600 text-white font-black rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm ${
              sidebarCollapsed ? 'px-1' : ''
            }`}
            title="Quay lại giao diện Lớp 5B.2 Vui Vẻ"
          >
            <span className="text-base shrink-0">🔙</span>
            {!sidebarCollapsed && <span className="truncate">Về Lớp 5B.2</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex-grow flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* TOP BANNER: "Vui đến trường" with User's requested copy */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500 text-white px-4 py-3 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-sm sm:text-base font-black tracking-wide">
                  Vui đến trường
                </span>
                <span className="text-blue-200 text-xs hidden sm:inline">•</span>
                <span className="text-xs font-extrabold text-amber-200">
                  Mỗi ngày đến lớp – Mỗi ngày một niềm vui!
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium mt-0.5">
                🌈 Học tập tích cực • Sáng tạo mỗi ngày • Yêu thương và sẻ chia
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-bold text-amber-100">
              <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                👩‍🏫 GVCN: Cô Kim Tiến
              </span>
              <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                👧👦 Sĩ số: 42 học sinh
              </span>
            </div>
          </div>
        </div>

        {/* TOP HEADER CONTROLS */}
        <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-20 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
            {/* Mobile Hamburger & Breadcrumb */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 shrink-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-xs font-black text-blue-700 uppercase tracking-wider hidden sm:inline shrink-0">
                  LỚP 5B.2
                </span>
                <span className="text-slate-300 hidden sm:inline shrink-0">•</span>
                <span className="text-xs sm:text-sm md:text-base font-black text-slate-900 whitespace-nowrap">
                  {activeModule === 'overview' && '1. Tổng quan lớp học'}
                  {activeModule === 'students' && '2. Danh sách 42 học sinh'}
                  {activeModule === 'assignments' && '3. Giao bài tập theo tuần'}
                  {activeModule === 'progress' && '4. Theo dõi tiến độ học tập'}
                  {activeModule === 'reports' && '5. Báo cáo & Xuất dữ liệu'}
                </span>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 justify-start md:justify-end">
              {/* Back to Classroom Button in Header */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onOpenToolkitTab('seating');
                }}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all flex items-center space-x-1 cursor-pointer whitespace-nowrap shrink-0"
                title="Quay lại giao diện Lớp 5B.2 Vui Vẻ (Sơ đồ lớp)"
              >
                <span>🔙</span>
                <span className="whitespace-nowrap">Về Lớp 5B.2</span>
              </button>

              {/* Quick Week Select */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shrink-0 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={selectedWeek}
                  onChange={(e) => {
                    soundEffects.playClick();
                    setSelectedWeek(e.target.value);
                  }}
                  className="bg-transparent font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="Tất cả các tuần">Tất cả tuần</option>
                  {uniqueWeeks.map((w) => (
                    <option key={w} value={w}>
                      {w === academicInfo.weekLabel ? `⭐ ${w} (Hiện tại)` : w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fast Action: + Giao bài */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveModule('assignments');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Giao bài mới</span>
              </button>

              {/* PWA Install Button */}
              <div className="shrink-0">
                <PWAInstallButton />
              </div>

              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
                title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                {soundOn ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Account Switch & Logout */}
              <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 shrink-0">
                <button
                  onClick={() => switchAccount()}
                  className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Chuyển đổi tài khoản khác"
                  aria-label="Chuyển đổi tài khoản"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                </button>
                <button
                  onClick={() => logout()}
                  className="p-1.5 sm:p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE SLIDE-OUT MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-black text-sm text-slate-900">
                    Trợ Lý Chủ Nhiệm 5B.2
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Hệ thống LMS
                  </div>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveModule(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Công cụ lớp học
                  </div>
                  {toolkitItems.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onOpenToolkitTab(tool.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center space-x-2"
                    >
                      <tool.icon className="w-4 h-4 text-slate-400" />
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </div>

                {/* Mobile Back to Classroom Button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onOpenToolkitTab('seating');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 px-3 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-black rounded-xl shadow-md text-xs cursor-pointer"
                  >
                    <span className="text-base">🔙</span>
                    <span>Về Lớp 5B.2</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY: ACTIVE MODULE */}
        <main className="flex-1 flex-grow min-w-0 w-full max-w-7xl mx-auto p-3.5 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 overflow-x-hidden">
          {/* Thông Báo Sự Kiện Sắp Tới Dành Cho Học Sinh & Lớp Học */}
          <HighlightedEventAnnouncements audience="students" />

          {/* Weekly Academic Progress Bar Visualizer */}
          <WeeklyProgressBar
            selectedWeek={selectedWeek}
            onViewAssignments={() => setActiveModule('assignments')}
          />

          {activeModule === 'overview' && (
            <ErrorBoundary sectionName="Tổng quan Lớp 5B.2">
              <LMSOverview
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                onNavigateToTab={handleNavigateWithFilters}
                onOpenCreateTask={() => setActiveModule('assignments')}
              />
            </ErrorBoundary>
          )}

          {activeModule === 'students' && (
            <ErrorBoundary sectionName="Danh sách & Hồ sơ Học sinh">
              <LMSStudentList
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                initialFilterStatus={drilldownFilter.filterStatus}
                initialSelectedStudentId={drilldownFilter.studentId}
              />
            </ErrorBoundary>
          )}

          {activeModule === 'assignments' && (
            <ErrorBoundary sectionName="Giao & Quản lý Nhiệm vụ Tuần">
              <LMSWeeklyAssignment
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
              />
            </ErrorBoundary>
          )}

          {activeModule === 'progress' && (
            <ErrorBoundary sectionName="Theo dõi Tiến độ & Sổ Điểm">
              <LMSProgressTracker
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                initialFilterStatus={drilldownFilter.filterStatus}
                initialStudentId={drilldownFilter.studentId}
                initialTaskId={drilldownFilter.taskId}
              />
            </ErrorBoundary>
          )}

          {activeModule === 'reports' && (
            <ErrorBoundary sectionName="Báo cáo & Xuất Dữ liệu">
              <LMSReportsExport
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
              />
            </ErrorBoundary>
          )}
        </main>

        {/* FOOTER: "Vui đến trường" with User's requested copy */}
        <footer className="bg-white border-t border-slate-200/90 py-8 px-4 text-center mt-12 text-slate-600 font-medium">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Vui đến trường
              </h3>
              <p className="text-sm font-bold text-blue-700">
                Mỗi ngày đến lớp – Mỗi ngày một niềm vui!
              </p>
              <p className="text-xs text-slate-500">
                🌈 Học tập tích cực • Sáng tạo mỗi ngày • Yêu thương và sẻ chia
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 text-xs font-bold text-slate-700 flex-wrap gap-y-1">
              <span>👩‍🏫 Giáo viên chủ nhiệm: <strong>Cô Kim Tiến</strong></span>
              <span>•</span>
              <span>👧👦 Sĩ số: <strong>42 học sinh</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 max-w-2xl mx-auto pt-2 text-left sm:text-left">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                <span className="text-amber-500">⭐</span>
                <span><strong>Học tập tích điểm</strong> – Ghi nhận nỗ lực, khuyến khích tiến bộ</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                <span className="text-blue-500">📝</span>
                <span><strong>Bài tập thông minh</strong> – Hỗ trợ chấm bài, theo dõi kết quả</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                <span className="text-purple-500">🎡</span>
                <span><strong>Vòng quay may mắn</strong> – Tạo hứng thú, khuyến khích học sinh tham gia</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                <span className="text-pink-500">📸</span>
                <span><strong>Camera AI tương tác</strong> – Khám phá kiến thức qua trải nghiệm sáng tạo</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-block bg-blue-50 text-blue-800 text-xs font-black px-4 py-1.5 rounded-full border border-blue-200">
                ✨ Cùng học tập – Cùng tiến bộ – Cùng tỏa sáng!
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};