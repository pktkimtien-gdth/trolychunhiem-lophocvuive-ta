import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { WebsiteUIConfig, WebsiteThemeConfig, WebsiteContentConfig, NavMenuItemConfig } from '../types';

export const THEME_PRESETS: WebsiteThemeConfig[] = [
  {
    id: 'theme-5b2-energetic',
    name: '5B.2 Năng Động (Chuẩn)',
    primaryColor: '#2563eb', // Royal Blue
    secondaryColor: '#f59e0b', // Amber / Gold
    accentColor: '#10b981', // Emerald Green
    backgroundColor: '#f8fafc', // Slate 50
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    cardRadius: 'xl',
    fontSizeScale: 'normal',
    bannerStyle: 'gradient',
  },
  {
    id: 'theme-friendly-school',
    name: 'Trường Học Thân Thiện',
    primaryColor: '#059669', // Emerald Green
    secondaryColor: '#f59e0b', // Amber
    accentColor: '#3b82f6', // Sky Blue
    backgroundColor: '#f0fdf4', // Light green tint
    surfaceColor: '#ffffff',
    textColor: '#064e3b',
    cardRadius: '2xl',
    fontSizeScale: 'normal',
    bannerStyle: 'warm',
  },
  {
    id: 'theme-green-hope',
    name: 'Mầm Xanh Tri Thức',
    primaryColor: '#0d9488', // Teal
    secondaryColor: '#eab308', // Yellow
    accentColor: '#14b8a6', // Bright Teal
    backgroundColor: '#f0fdfa',
    surfaceColor: '#ffffff',
    textColor: '#134e4a',
    cardRadius: 'xl',
    fontSizeScale: 'normal',
    bannerStyle: 'pastel',
  },
  {
    id: 'theme-morning-sun',
    name: 'Bình Minh Tươi Sáng',
    primaryColor: '#ea580c', // Orange
    secondaryColor: '#9333ea', // Purple
    accentColor: '#0284c7', // Ocean Blue
    backgroundColor: '#fffbeb', // Light Amber tint
    surfaceColor: '#ffffff',
    textColor: '#7c2d12',
    cardRadius: '2xl',
    fontSizeScale: 'normal',
    bannerStyle: 'playful',
  },
  {
    id: 'theme-ocean-blue',
    name: 'Biển Xanh Bao La',
    primaryColor: '#0284c7', // Sky 600
    secondaryColor: '#0d9488', // Teal 600
    accentColor: '#f59e0b', // Amber
    backgroundColor: '#f0f9ff',
    surfaceColor: '#ffffff',
    textColor: '#0c4a6e',
    cardRadius: 'xl',
    fontSizeScale: 'normal',
    bannerStyle: 'gradient',
  },
  {
    id: 'theme-sweet-pastel',
    name: 'Kẹo Bông Mơ Mộng',
    primaryColor: '#7c3aed', // Violet 600
    secondaryColor: '#ec4899', // Pink 500
    accentColor: '#f59e0b', // Amber
    backgroundColor: '#faf5ff',
    surfaceColor: '#ffffff',
    textColor: '#4c1d95',
    cardRadius: '2xl',
    fontSizeScale: 'normal',
    bannerStyle: 'playful',
  },
];

export const DEFAULT_UI_CONFIG: WebsiteUIConfig = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Hệ thống Mặc định',
  content: {
    brandName: 'Vui Đến Trường',
    className: 'Lớp 5B.2 Vui Vẻ',
    schoolName: 'Trường Tiểu Học',
    teacherName: 'Cô Kim Tiến Number Hi!',
    schoolYear: 'Năm học 2026 - 2027',
    slogans: [
      'Mỗi ngày đến lớp – Mỗi ngày một niềm vui!',
      '🌈 Học tập tích cực • Sáng tạo mỗi ngày • Yêu thương và sẻ chia',
      '✨ Cùng học tập – Cùng tiến bộ – Cùng tỏa sáng!',
    ],
    subSlogan: 'Nơi tri thức là niềm vui • GVCN: Cô Kim Tiến Number Hi!',
    welcomeMessage: 'Chào mừng các em học sinh và phụ huynh lớp 5B.2!',
    announcementBanner: 'Chào đón tuần học mới tràn đầy hứng khởi, tích cực rèn luyện và gặt hái thật nhiều hoa điểm 10!',
    showAnnouncementBanner: true,
    showSloganBanner: true,
    showWeeklyProgress: true,
    defaultLandingTab: 'seating',
  },
  theme: THEME_PRESETS[0],
  navMenu: [
    { id: 'm-lms', label: 'Hệ Thống LMS', icon: 'LayoutDashboard', tabKey: 'lms', visible: true, order: 1, isSystem: true, badge: 'Chủ Nhiệm' },
    { id: 'm-seating', label: 'Sơ Đồ Lớp Học', icon: 'LayoutGrid', tabKey: 'seating', visible: true, order: 2, isSystem: true },
    { id: 'm-worksheets', label: 'Kho Bài Tập & Chấm Điểm', icon: 'BookOpen', tabKey: 'worksheets', visible: true, order: 3, isSystem: true, badge: '≥80% +Xu' },
    { id: 'm-gifts', label: 'Cửa Hàng Đổi Quà', icon: 'Gift', tabKey: 'gifts', visible: true, order: 4, isSystem: true },
    { id: 'm-picker', label: 'Đồng Hồ Quả Lắc & Vòng Quay', icon: 'Clock', tabKey: 'picker', visible: true, order: 5, isSystem: true, badge: 'HOT' },
    { id: 'm-camera-ai', label: 'Trò Chơi Camera AI', icon: 'Camera', tabKey: 'camera-ai', visible: true, order: 6, isSystem: true, badge: 'AI' },
    { id: 'm-reports', label: 'Báo Cáo & Thời Khóa Biểu', icon: 'Award', tabKey: 'reports', visible: true, order: 7, isSystem: true, badge: 'TKB' },
    { id: 'm-links', label: 'Kho Liên Kết Học Tập', icon: 'Bookmark', tabKey: 'links', visible: true, order: 8, isSystem: true, badge: 'Supabase' },
    { id: 'm-video-library', label: 'Kho Video Bài Giảng AI', icon: 'Tv', tabKey: 'video-library', visible: true, order: 9, isSystem: true, badge: 'Drive/YT' },
    { id: 'm-library', label: 'Kệ Sách & Thư Viện', icon: 'Library', tabKey: 'library', visible: true, order: 10, isSystem: true, badge: 'Sách Số' },
    { id: 'm-contest', label: 'Sáng Kiến AI 2026', icon: 'Sparkles', tabKey: 'contest', visible: true, order: 11, isSystem: true },
  ],
};

const LOCAL_STORAGE_KEY = 'lop_hoc_5b2_ui_config_v2';

interface UIConfigContextType {
  config: WebsiteUIConfig;
  theme: WebsiteThemeConfig;
  content: WebsiteContentConfig;
  navMenu: NavMenuItemConfig[];
  previewConfig: WebsiteUIConfig | null;
  setPreviewConfig: (cfg: WebsiteUIConfig | null) => void;
  isLoading: boolean;
  saveConfig: (newConfig: Partial<WebsiteUIConfig>) => Promise<{ success: boolean; message: string }>;
  resetToDefault: () => Promise<{ success: boolean; message: string }>;
  refreshConfig: () => Promise<void>;
}

const UIConfigContext = createContext<UIConfigContextType | null>(null);

export const UIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WebsiteUIConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_UI_CONFIG,
          ...parsed,
          theme: { ...DEFAULT_UI_CONFIG.theme, ...(parsed.theme || {}) },
          content: { ...DEFAULT_UI_CONFIG.content, ...(parsed.content || {}) },
          navMenu: parsed.navMenu && parsed.navMenu.length > 0 ? parsed.navMenu : DEFAULT_UI_CONFIG.navMenu,
        };
      }
    } catch (e) {
      console.warn('[UIConfig] Failed to parse local config:', e);
    }
    return DEFAULT_UI_CONFIG;
  });

  const [previewConfig, setPreviewConfig] = useState<WebsiteUIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active config (uses previewConfig when editing in admin customizer)
  const activeConfig = previewConfig || config;

  // Apply CSS Custom Properties to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = activeConfig.theme;

    root.style.setProperty('--primary-color', currentTheme.primaryColor);
    root.style.setProperty('--secondary-color', currentTheme.secondaryColor);
    root.style.setProperty('--accent-color', currentTheme.accentColor);
    root.style.setProperty('--bg-color', currentTheme.backgroundColor);
    root.style.setProperty('--surface-color', currentTheme.surfaceColor);
    root.style.setProperty('--text-color', currentTheme.textColor);

    const radiusMap = {
      sm: '6px',
      md: '10px',
      lg: '16px',
      xl: '20px',
      '2xl': '28px',
    };
    root.style.setProperty('--card-radius', radiusMap[currentTheme.cardRadius] || '20px');

    const fontScaleMap = {
      compact: '0.92',
      normal: '1',
      large: '1.08',
    };
    root.style.setProperty('--font-scale', fontScaleMap[currentTheme.fontSizeScale] || '1');
  }, [activeConfig.theme]);

  // Sync with backend API on mount
  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config/ui');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.config));
        }
      }
    } catch (err) {
      console.warn('[UIConfig] API sync failed, using offline cache:', err);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Save config to server and local storage
  const saveConfig = useCallback(async (newConfig: Partial<WebsiteUIConfig>): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const mergedConfig: WebsiteUIConfig = {
        ...config,
        ...newConfig,
        updatedAt: new Date().toISOString(),
      };

      // Get JWT token from storage
      const token = localStorage.getItem('auth_token') || localStorage.getItem('lop_hoc_5b2_auth_token');

      const res = await fetch('/api/config/ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(mergedConfig),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setPreviewConfig(null);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.config));
        setIsLoading(false);
        return { success: true, message: 'Lưu và áp dụng cấu hình giao diện thành công!' };
      } else {
        // Fallback: save to localStorage anyway
        setConfig(mergedConfig);
        setPreviewConfig(null);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedConfig));
        setIsLoading(false);
        return {
          success: true,
          message: data.message || 'Đã áp dụng cấu hình lên trình duyệt thành công!',
        };
      }
    } catch (error: any) {
      // Offline fallback
      const fallbackConfig: WebsiteUIConfig = {
        ...config,
        ...newConfig,
        updatedAt: new Date().toISOString(),
      };
      setConfig(fallbackConfig);
      setPreviewConfig(null);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackConfig));
      setIsLoading(false);
      return { success: true, message: 'Đã lưu cấu hình ngoại tuyến vào thiết bị!' };
    }
  }, [config]);

  // Reset to factory defaults
  const resetToDefault = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('lop_hoc_5b2_auth_token');
      const res = await fetch('/api/config/ui/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setPreviewConfig(null);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.config));
        setIsLoading(false);
        return { success: true, message: 'Đã khôi phục giao diện mặc định ban đầu!' };
      }
    } catch (e) {
      console.warn('[UIConfig] Server reset failed, resetting locally:', e);
    }

    const resetCfg = JSON.parse(JSON.stringify(DEFAULT_UI_CONFIG));
    setConfig(resetCfg);
    setPreviewConfig(null);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resetCfg));
    setIsLoading(false);
    return { success: true, message: 'Đã khôi phục giao diện mặc định ban đầu!' };
  }, []);

  const value = useMemo<UIConfigContextType>(() => ({
    config: activeConfig,
    theme: activeConfig.theme,
    content: activeConfig.content,
    navMenu: [...activeConfig.navMenu].sort((a, b) => a.order - b.order),
    previewConfig,
    setPreviewConfig,
    isLoading,
    saveConfig,
    resetToDefault,
    refreshConfig,
  }), [activeConfig, previewConfig, isLoading, saveConfig, resetToDefault, refreshConfig]);

  return <UIConfigContext.Provider value={value}>{children}</UIConfigContext.Provider>;
};

export const useUIConfig = (): UIConfigContextType => {
  const ctx = useContext(UIConfigContext);
  if (!ctx) {
    throw new Error('useUIConfig must be used within a UIConfigProvider');
  }
  return ctx;
};
