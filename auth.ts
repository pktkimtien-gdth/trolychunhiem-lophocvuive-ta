import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// In production, configure JWT_SECRET and JWT_REFRESH_SECRET in environment variables (.env)
export const JWT_SECRET = process.env.JWT_SECRET || 'lms-5b2-secure-jwt-secret-key-2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'lms-5b2-refresh-secret-key-2026';
export const ACCESS_TOKEN_EXPIRY = '2h';
export const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  id: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  name: string;
  studentCode?: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Generate Access Token (short-lived, 2 hours)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate Refresh Token (long-lived, 7 days)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Middleware: Verify JWT Access Token from Authorization Header or Cookie
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if ((req as any).cookies?.access_token) {
    token = (req as any).cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'Yêu cầu đăng nhập. Không tìm thấy token xác thực hợp lệ.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng làm mới token hoặc đăng nhập lại.',
      });
    }

    return res.status(403).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token không hợp lệ hoặc đã bị can thiệp.',
    });
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC) - Teacher or Admin
 * Protects administrative and modification routes against unauthorized student/parent calls.
 */
export function requireTeacher(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'Vui lòng đăng nhập trước khi thực hiện thao tác này.',
    });
  }

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN_TEACHER_ONLY',
      message: 'Từ chối truy cập! Thao tác này chỉ dành riêng cho Giáo viên chủ nhiệm hoặc Quản trị viên.',
    });
  }

  return next();
}

/**
 * Middleware: Role-Based Access Control (RBAC) - Admin only
 * Protects website configuration, theme, and layout modification routes.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'Vui lòng đăng nhập với tài khoản Quản trị viên để thực hiện thao tác này.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Từ chối truy cập! Thao tác này chỉ dành riêng cho Quản trị viên hệ thống (Admin).',
    });
  }

  return next();
}

/**
 * Middleware: IDOR Protection (Insecure Direct Object Reference)
 * Allows teachers to modify any student, but ensures a student can only modify their OWN data.
 */
export function requireStudentOrTeacher(studentIdParamKey = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Vui lòng đăng nhập.',
      });
    }

    // Teacher or Admin has universal access
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      return next();
    }

    // Student can only access / mutate their own records
    const targetStudentId = req.params[studentIdParamKey] || req.body.studentId;
    if (req.user.role === 'student' && req.user.id === targetStudentId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'IDOR_PREVENTED',
      message: 'Từ chối truy cập! Bạn chỉ có quyền thao tác trên dữ liệu học tập của chính mình.',
    });
  };
}
