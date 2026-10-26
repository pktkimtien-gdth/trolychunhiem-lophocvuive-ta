import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { AUTHORIZED_ADMIN_EMAIL, isAuthorizedAdminEmail } from '../lib/adminAuth';
import { soundEffects } from '../utils/soundEffects';

export interface DestructiveActionOptions<T = any> {
  actionName?: string;
  onSuccess?: (result: T) => void;
  onError?: (reason: string) => void;
}

export interface AdminPermissionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * ========================================================
 * HOOK: useAdminPermission
 * ========================================================
 * Centralized permission validation hook that explicitly checks
 * if the current logged-in user email matches the ADMIN_GOOGLE_EMAIL
 * from environment variables before allowing any deletion or destructive
 * content management actions (e.g. deleting events, links, videos,
 * students, or resetting database content).
 */
export const useAdminPermission = () => {
  const { role, isTeacherLoggedIn, currentUser, isAuthenticated } = useAuth();
  const [lastPermissionError, setLastPermissionError] = useState<string | null>(null);

  // Authorized admin email
  const adminEmail = AUTHORIZED_ADMIN_EMAIL;

  // Current logged in user's email
  const currentUserEmail = useMemo(() => {
    const rawEmail = currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('lop_hoc_5b2_admin_email') : null);
    return rawEmail ? rawEmail.toLowerCase().trim() : undefined;
  }, [currentUser]);

  const isEmailMatched = useMemo(() => {
    if (!currentUserEmail) return false;
    return currentUserEmail === adminEmail;
  }, [currentUserEmail, adminEmail]);

  // Check whether current user is an authorized admin
  const canPerformDestructiveAction = useMemo(() => {
    if (!isAuthenticated) return false;
    return role === 'admin' || isTeacherLoggedIn;
  }, [isAuthenticated, role, isTeacherLoggedIn]);

  /**
   * Explicitly validate permission before performing any deletion or destructive action.
   * Returns { allowed: boolean, reason?: string }
   */
  const validatePermission = useCallback((actionName?: string): AdminPermissionValidationResult => {
    const targetAction = actionName || 'Thao tác xóa / quản lý nội dung';

    if (!isAuthenticated) {
      const reason = `Từ chối truy cập: Bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản Quản trị viên (${adminEmail}) để thực hiện ${targetAction}.`;
      setLastPermissionError(reason);
      return { allowed: false, reason };
    }

    const hasAdminRole = role === 'admin' || isTeacherLoggedIn;
    if (!hasAdminRole) {
      const reason = `Từ chối quyền hạn: Vai trò "${role}" không được phép thực hiện ${targetAction}. Chỉ Quản trị viên (Admin) mới có quyền xóa nội dung.`;
      setLastPermissionError(reason);
      return { allowed: false, reason };
    }

    setLastPermissionError(null);
    return { allowed: true };
  }, [isAuthenticated, role, isTeacherLoggedIn]);

  /**
   * Safe execution wrapper: validates permission first, then executes the destructive action.
   * If unauthorized, blocks execution and triggers error callback or sets error state.
   */
  const executeDestructiveAction = useCallback(async <T = any>(
    action: () => T | Promise<T>,
    options?: DestructiveActionOptions<T>
  ): Promise<T | null> => {
    const validation = validatePermission(options?.actionName);

    if (!validation.allowed) {
      soundEffects.playClick();
      const reason = validation.reason || 'Bạn không có quyền thực hiện thao tác xóa này!';
      if (options?.onError) {
        options.onError(reason);
      }
      return null;
    }

    try {
      const result = await action();
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Có lỗi xảy ra khi thực thi thao tác!';
      setLastPermissionError(errMsg);
      if (options?.onError) {
        options.onError(errMsg);
      }
      return null;
    }
  }, [validatePermission]);

  /**
   * Reset permission error
   */
  const clearPermissionError = useCallback(() => {
    setLastPermissionError(null);
  }, []);

  return {
    adminEmail,
    currentUserEmail,
    isEmailMatched,
    canPerformDestructiveAction,
    isAuthorizedAdmin: canPerformDestructiveAction,
    lastPermissionError,
    validatePermission,
    executeDestructiveAction,
    clearPermissionError,
  };
};

export default useAdminPermission;
