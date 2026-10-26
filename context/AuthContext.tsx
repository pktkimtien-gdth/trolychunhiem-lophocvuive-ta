import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { Student, UserRole } from '../types';
import { sounds } from '../utils/audio';
import { verifyGoogleAdminLogin, AUTHORIZED_ADMIN_EMAIL } from '../lib/adminAuth';

export interface ChangePinResult {
  success: boolean;
  message: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  studentCode?: string;
  avatar?: string;
  gender?: 'male' | 'female';
}

export interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  isTeacherLoggedIn: boolean;
  setIsTeacherLoggedIn: (val: boolean) => void;
  isAdminLoggedIn: boolean;
  activeParentStudentId: string | null;
  setActiveParentStudentId: (id: string | null) => void;
  isDefaultPin: boolean;

  // Modern login actions
  loginAsTeacherOrAdmin: (pin: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  loginAsTeacherWithGoogle: (email: string, name?: string, credential?: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  loginAsStudent: (student: Student) => void;
  loginAsParent: (student: Student, pin?: string) => Promise<{ success: boolean; message: string }>;

  // Session & account actions
  logout: () => void;
  switchAccount: () => void;

  // Backward compatibility methods
  selectStudentLogin: (student: Student) => void;
  logoutStudent: () => void;
  verifyTeacherPin: (pin: string) => boolean;
  changeTeacherPin: (oldPin: string, newPin: string, confirmPin: string) => Promise<ChangePinResult>;
  logoutTeacher: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';
const SESSION_STORAGE_KEY = 'lop_hoc_5b2_user_session_v1';
const DEFAULT_TEACHER_PIN = '123456';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check stored session
  const [session, setSession] = useState<{
    isAuthenticated: boolean;
    role: UserRole;
    user: AuthUser | null;
    student: Student | null;
    activeParentStudentId: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isAuthenticated) {
          return {
            isAuthenticated: true,
            role: parsed.role || 'student',
            user: parsed.user || null,
            student: parsed.student || null,
            activeParentStudentId: parsed.activeParentStudentId || null,
          };
        }
      }
    } catch (e) {
      console.warn('[AuthContext] Session restore error:', e);
    }
    return {
      isAuthenticated: false,
      role: 'student',
      user: null,
      student: null,
      activeParentStudentId: null,
    };
  });

  const [role, setRoleState] = useState<UserRole>(session.role);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(session.isAuthenticated);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(session.user);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(session.student);
  const [isTeacherLoggedIn, setIsTeacherLoggedInState] = useState<boolean>(
    session.role === 'admin' || session.role === 'teacher'
  );
  const [activeParentStudentId, setActiveParentStudentIdState] = useState<string | null>(
    session.activeParentStudentId
  );

  const [isDefaultPin, setIsDefaultPin] = useState<boolean>(() => {
    const hasChanged = localStorage.getItem(STORAGE_KEY_PREFIX + 'teacher_pin_changed');
    return hasChanged !== 'true';
  });

  const [teacherPin, setTeacherPin] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'teacher_pin');
    if (saved) return saved;
    return bcrypt.hashSync(DEFAULT_TEACHER_PIN, 10);
  });

  // Persist session to localStorage whenever key auth items change
  const persistSession = useCallback((
    authVal: boolean,
    rVal: UserRole,
    uVal: AuthUser | null,
    sVal: Student | null,
    parentIdVal: string | null
  ) => {
    if (authVal) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        isAuthenticated: true,
        role: rVal,
        user: uVal,
        student: sVal,
        activeParentStudentId: parentIdVal,
        timestamp: new Date().toISOString(),
      }));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'admin' || newRole === 'teacher') {
      setIsTeacherLoggedInState(true);
    } else {
      setIsTeacherLoggedInState(false);
    }
    persistSession(isAuthenticated, newRole, currentUser, currentStudent, activeParentStudentId);
  }, [isAuthenticated, currentUser, currentStudent, activeParentStudentId, persistSession]);

  const setCurrentStudent = useCallback((student: Student | null) => {
    setCurrentStudentState(student);
    persistSession(isAuthenticated, role, currentUser, student, activeParentStudentId);
  }, [isAuthenticated, role, currentUser, activeParentStudentId, persistSession]);

  const setIsTeacherLoggedIn = useCallback((val: boolean) => {
    setIsTeacherLoggedInState(val);
    if (val && role !== 'admin') {
      setRoleState('teacher');
    }
  }, [role]);

  const setActiveParentStudentId = useCallback((id: string | null) => {
    setActiveParentStudentIdState(id);
    persistSession(isAuthenticated, role, currentUser, currentStudent, id);
  }, [isAuthenticated, role, currentUser, currentStudent, persistSession]);

  // Modern login: Teacher / Admin via PIN
  const loginAsTeacherOrAdmin = useCallback(async (pin: string): Promise<{ success: boolean; message: string; role?: UserRole }> => {
    if (!pin) {
      sounds.playWrong();
      return { success: false, message: 'Vui lòng cung cấp mã PIN quản trị.' };
    }

    try {
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('lop_hoc_5b2_auth_token', data.token);
        }
        if (data.refreshToken) {
          localStorage.setItem('refresh_token', data.refreshToken);
        }

        const resolvedRole: UserRole = data.user?.role || 'admin';
        const teacherUser: AuthUser = {
          id: data.user?.id || 'teacher-admin',
          name: data.user?.name || 'Cô Kim Tiến (GVCN Lớp 5B.2)',
          email: data.user?.email || AUTHORIZED_ADMIN_EMAIL,
          role: resolvedRole,
        };

        setIsAuthenticated(true);
        setRoleState(resolvedRole);
        setIsTeacherLoggedInState(true);
        setCurrentUser(teacherUser);
        setCurrentStudentState(null);
        setActiveParentStudentIdState(null);
        persistSession(true, resolvedRole, teacherUser, null, null);

        sounds.playCorrect();
        return { success: true, message: data.message || 'Đăng nhập thành công!', role: resolvedRole };
      } else {
        sounds.playWrong();
        return { success: false, message: data.message || 'Mã PIN bảo mật không chính xác!' };
      }
    } catch (e) {
      // Local fallback for offline mode
      const trimmed = pin.trim();
      let isMatch = false;
      try {
        if (teacherPin.startsWith('$2a$') || teacherPin.startsWith('$2b$')) {
          isMatch = bcrypt.compareSync(trimmed, teacherPin);
        } else {
          isMatch = trimmed === teacherPin;
        }
      } catch {
        isMatch = false;
      }
      if (!isMatch && isDefaultPin && (trimmed === 'admin' || trimmed === 'teacher' || trimmed === DEFAULT_TEACHER_PIN)) {
        isMatch = true;
      }

      if (isMatch) {
        const teacherUser: AuthUser = {
          id: 'teacher-admin',
          name: 'Cô Kim Tiến (GVCN Lớp 5B.2)',
          email: AUTHORIZED_ADMIN_EMAIL,
          role: 'admin',
        };
        setIsAuthenticated(true);
        setRoleState('admin');
        setIsTeacherLoggedInState(true);
        setCurrentUser(teacherUser);
        persistSession(true, 'admin', teacherUser, null, null);
        sounds.playCorrect();
        return { success: true, message: 'Đăng nhập Quản trị viên thành công (Ngoại tuyến)!', role: 'admin' };
      }

      sounds.playWrong();
      return { success: false, message: 'Mã PIN bảo mật không chính xác.' };
    }
  }, [teacherPin, isDefaultPin, persistSession]);

  /**
   * ========================================================
   * ĐĂNG NHẬP GOOGLE DÀNH CHO QUẢN TRỊ VIÊN (CÔ KIM TIẾN)
   * ========================================================
   * - Hoạt động song song an toàn tuyệt đối với mã PIN cũ
   * - Chỉ cấp quyền Admin nếu email trùng khớp với pkt.kimtien@gmail.com
   * - Tự động kế thừa toàn bộ trạng thái isAdmin = true, role = 'admin'
   * ========================================================
   */
  const loginAsTeacherWithGoogle = useCallback(async (
    email: string,
    name?: string,
    credential?: string
  ): Promise<{ success: boolean; message: string; role?: UserRole }> => {
    const res = await verifyGoogleAdminLogin(email, name, credential);

    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('lop_hoc_5b2_auth_token', res.token);
      }
      if (res.refreshToken) {
        localStorage.setItem('refresh_token', res.refreshToken);
      }

      const teacherUser: AuthUser = {
        id: 'teacher-admin',
        name: res.user.name || 'Cô Kim Tiến (GVCN Lớp 5B.2)',
        email: res.user.email || AUTHORIZED_ADMIN_EMAIL,
        role: 'admin',
      };

      setIsAuthenticated(true);
      setRoleState('admin');
      setIsTeacherLoggedInState(true);
      setCurrentUser(teacherUser);
      setCurrentStudentState(null);
      setActiveParentStudentIdState(null);
      persistSession(true, 'admin', teacherUser, null, null);

      sounds.playCorrect();
      return {
        success: true,
        message: res.message || 'Đăng nhập Quản trị viên bằng Google thành công!',
        role: 'admin',
      };
    } else {
      sounds.playWrong();
      return {
        success: false,
        message: res.message || 'Đăng nhập Google không thành công.',
      };
    }
  }, [persistSession]);

  // Modern login: Student
  const loginAsStudent = useCallback((student: Student) => {
    const studentUser: AuthUser = {
      id: student.id,
      name: student.name,
      role: 'student',
      studentCode: student.studentCode,
      avatar: student.avatar,
    };

    setIsAuthenticated(true);
    setRoleState('student');
    setIsTeacherLoggedInState(false);
    setCurrentStudentState(student);
    setCurrentUser(studentUser);
    setActiveParentStudentIdState(null);
    persistSession(true, 'student', studentUser, student, null);
    sounds.playCorrect();
  }, [persistSession]);

  // Modern login: Parent
  const loginAsParent = useCallback(async (student: Student, pin?: string): Promise<{ success: boolean; message: string }> => {
    // If student has a parentPin, check it
    if (student.parentPin && pin) {
      if (pin.trim() !== student.parentPin.trim()) {
        sounds.playWrong();
        return { success: false, message: 'Mã PIN phụ huynh không khớp với thông tin học sinh!' };
      }
    }

    const parentUser: AuthUser = {
      id: `parent-${student.id}`,
      name: `Phụ huynh của học sinh: ${student.name}`,
      role: 'parent',
      studentCode: student.studentCode,
      avatar: student.avatar,
    };

    setIsAuthenticated(true);
    setRoleState('parent');
    setIsTeacherLoggedInState(false);
    setCurrentStudentState(student);
    setActiveParentStudentIdState(student.id);
    setCurrentUser(parentUser);
    persistSession(true, 'parent', parentUser, student, student.id);
    sounds.playCorrect();

    return { success: true, message: `Chào mừng Phụ huynh của học sinh ${student.name} đã kết nối vào Lớp 5B.2!` };
  }, [persistSession]);

  // Clean Logout: Completely clear credentials and reset to Welcome state
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setRoleState('student');
    setCurrentStudentState(null);
    setIsTeacherLoggedInState(false);
    setActiveParentStudentIdState(null);
    setCurrentUser(null);
    persistSession(false, 'student', null, null, null);
    sounds.playCorrect();
  }, [persistSession]);

  // Switch Account: Same as clean logout, triggers role selection
  const switchAccount = useCallback(() => {
    logout();
  }, [logout]);

  // Backward compatibility: selectStudentLogin
  const selectStudentLogin = useCallback((student: Student) => {
    loginAsStudent(student);
  }, [loginAsStudent]);

  const logoutStudent = useCallback(() => {
    setCurrentStudentState(null);
  }, []);

  // Backward compatibility: verifyTeacherPin
  const verifyTeacherPin = useCallback((pin: string): boolean => {
    if (!pin) {
      sounds.playWrong();
      return false;
    }

    const trimmed = pin.trim();
    let isMatch = false;

    try {
      if (teacherPin.startsWith('$2a$') || teacherPin.startsWith('$2b$')) {
        isMatch = bcrypt.compareSync(trimmed, teacherPin);
      } else {
        isMatch = trimmed === teacherPin;
      }
    } catch (err) {
      console.error('[AuthContext] Bcrypt comparison error:', err);
      isMatch = false;
    }

    if (!isMatch && isDefaultPin && (trimmed === 'admin' || trimmed === 'teacher' || trimmed === DEFAULT_TEACHER_PIN)) {
      isMatch = true;
    }

    if (isMatch) {
      const teacherUser: AuthUser = {
        id: 'teacher-admin',
        name: 'Cô Kim Tiến (GVCN Lớp 5B.2)',
        role: 'admin',
      };
      setIsAuthenticated(true);
      setRoleState('admin');
      setIsTeacherLoggedInState(true);
      setCurrentUser(teacherUser);
      persistSession(true, 'admin', teacherUser, null, null);
      sounds.playCorrect();
      return true;
    }

    sounds.playWrong();
    return false;
  }, [teacherPin, isDefaultPin, persistSession]);

  const changeTeacherPin = useCallback(async (
    oldPin: string,
    newPin: string,
    confirmPin: string
  ): Promise<ChangePinResult> => {
    if (!oldPin?.trim() || !newPin?.trim() || !confirmPin?.trim()) {
      sounds.playWrong();
      return { success: false, message: 'Vui lòng nhập đầy đủ cả 3 ô thông tin mã PIN.' };
    }

    const trimmedOld = oldPin.trim();
    const trimmedNew = newPin.trim();
    const trimmedConfirm = confirmPin.trim();

    let isOldMatch = false;
    try {
      if (teacherPin.startsWith('$2a$') || teacherPin.startsWith('$2b$')) {
        isOldMatch = bcrypt.compareSync(trimmedOld, teacherPin);
      } else {
        isOldMatch = trimmedOld === teacherPin;
      }
    } catch {
      isOldMatch = false;
    }

    if (!isOldMatch && isDefaultPin && (trimmedOld === 'admin' || trimmedOld === 'teacher' || trimmedOld === DEFAULT_TEACHER_PIN)) {
      isOldMatch = true;
    }

    if (!isOldMatch) {
      sounds.playWrong();
      return { success: false, message: 'Mã PIN cũ không chính xác.' };
    }

    const isDigitsOnly = /^\d+$/.test(trimmedNew);
    if (!isDigitsOnly) {
      sounds.playWrong();
      return { success: false, message: 'Mã PIN mới chỉ được chứa các ký tự số (0-9).' };
    }

    if (trimmedNew.length < 6) {
      sounds.playWrong();
      return { success: false, message: 'Mã PIN mới phải có độ dài từ 6 ký tự số trở lên.' };
    }

    if (trimmedNew !== trimmedConfirm) {
      sounds.playWrong();
      return { success: false, message: 'Xác nhận Mã PIN mới không khớp với Mã PIN mới.' };
    }

    const saltRounds = 10;
    const hashedNewPin = bcrypt.hashSync(trimmedNew, saltRounds);

    setTeacherPin(hashedNewPin);
    setIsDefaultPin(false);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'teacher_pin', hashedNewPin);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'teacher_pin_changed', 'true');

    try {
      await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPin: trimmedOld,
          newPin: trimmedNew,
          confirmPin: trimmedConfirm,
        }),
      });
    } catch (e) {
      console.warn('[AuthContext] API sync notice:', e);
    }

    sounds.playCorrect();
    return {
      success: true,
      message: 'Đổi mã PIN quản trị viên thành công! Mã PIN đã được mã hóa bcrypt an toàn.',
    };
  }, [teacherPin, isDefaultPin]);

  const logoutTeacher = useCallback(() => {
    logout();
  }, [logout]);

  const isAdminLoggedIn = role === 'admin';

  const value = useMemo<AuthContextType>(() => ({
    role,
    setRole,
    isAuthenticated,
    currentUser,
    currentStudent,
    setCurrentStudent,
    isTeacherLoggedIn,
    setIsTeacherLoggedIn,
    isAdminLoggedIn,
    activeParentStudentId,
    setActiveParentStudentId,
    isDefaultPin,

    loginAsTeacherOrAdmin,
    loginAsTeacherWithGoogle,
    loginAsStudent,
    loginAsParent,
    logout,
    switchAccount,

    selectStudentLogin,
    logoutStudent,
    verifyTeacherPin,
    changeTeacherPin,
    logoutTeacher,
  }), [
    role,
    setRole,
    isAuthenticated,
    currentUser,
    currentStudent,
    setCurrentStudent,
    isTeacherLoggedIn,
    setIsTeacherLoggedIn,
    isAdminLoggedIn,
    activeParentStudentId,
    setActiveParentStudentId,
    isDefaultPin,

    loginAsTeacherOrAdmin,
    loginAsTeacherWithGoogle,
    loginAsStudent,
    loginAsParent,
    logout,
    switchAccount,

    selectStudentLogin,
    logoutStudent,
    verifyTeacherPin,
    changeTeacherPin,
    logoutTeacher,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
