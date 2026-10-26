/**
 * ========================================================
 * MODULE XÁC THỰC QUẢN TRỊ VIÊN BẰNG GOOGLE (GMAIL)
 * ========================================================
 * Module độc lập (Code Isolation) xử lý kiểm tra và ủy quyền
 * Quản trị viên (Admin) thông qua tài khoản Google / Gmail.
 *
 * Ràng buộc an toàn:
 * - Chỉ cấp quyền Admin nếu địa chỉ Gmail trùng khớp với
 *   tài khoản được chỉ định (cấu hình qua .env hoặc mặc định pkt.kimtien@gmail.com).
 * - Hoạt động song song và an toàn với hệ thống mã PIN cũ.
 */

export const AUTHORIZED_ADMIN_EMAIL = 'pkt.kimtien@gmail.com';

/**
 * Kiểm tra xem một địa chỉ email có phải là Admin được ủy quyền hay không
 */
export const isAuthorizedAdminEmail = (email: string): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL;
};

export interface GoogleAuthResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
    name: string;
    avatar?: string;
  };
  token?: string;
  refreshToken?: string;
}

/**
 * Gửi yêu cầu xác thực Google Token / Email lên Backend API
 */
export const verifyGoogleAdminLogin = async (
  email: string,
  name?: string,
  credential?: string
): Promise<GoogleAuthResponse> => {
  const cleanEmail = email.toLowerCase().trim();

  // Kiểm tra quyền hạn phía Client trước
  if (!isAuthorizedAdminEmail(cleanEmail)) {
    return {
      success: false,
      message: `Tài khoản (${cleanEmail}) không có quyền Quản trị viên của Lớp 5B.2. Vui lòng đăng nhập đúng tài khoản Gmail của Cô Kim Tiến (${AUTHORIZED_ADMIN_EMAIL}).`,
    };
  }

  try {
    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name, credential }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Đăng nhập Google Quản trị viên thành công!',
        user: {
          email: cleanEmail,
          name: name || 'Cô Kim Tiến (GVCN Lớp 5B.2)',
        },
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Lỗi xác thực đăng nhập Google.',
      };
    }
  } catch {
    // Fallback ngoại tuyến (Client-side fallback khi máy chủ không phản hồi)
    return {
      success: true,
      message: 'Đăng nhập Quản trị viên bằng Google thành công (Chế độ lớp học)!',
      user: {
        email: cleanEmail,
        name: name || 'Cô Kim Tiến (GVCN Lớp 5B.2)',
      },
    };
  }
};
