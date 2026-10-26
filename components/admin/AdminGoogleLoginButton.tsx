import React, { useState } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { AUTHORIZED_ADMIN_EMAIL, isAuthorizedAdminEmail } from '../../lib/adminAuth';
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface AdminGoogleLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * ========================================================
 * COMPONENT: NÚT ĐĂNG NHẬP GOOGLE DÀNH CHO QUẢN TRỊ VIÊN
 * ========================================================
 * - Tách biệt hoàn toàn thành component riêng (Code Isolation).
 * - Tích hợp xác thực an toàn bằng tài khoản Google (Gmail).
 * - Chỉ cấp quyền Admin / Giáo viên nếu email trùng khớp với
 *   địa chỉ Gmail của Cô Kim Tiến (pkt.kimtien@gmail.com).
 * - Kế thừa 100% quyền hạn quản trị (isAdmin = true, token JWT).
 * - Hoạt động song song hoặc thay thế cho việc nhập mã PIN.
 * ========================================================
 */
export const AdminGoogleLoginButton: React.FC<AdminGoogleLoginButtonProps> = ({
  onSuccess,
  className = '',
}) => {
  const { loginAsTeacherWithGoogle } = useClassroom();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState(AUTHORIZED_ADMIN_EMAIL);

  // Xử lý xác thực đăng nhập tài khoản Google
  const handleProceedGoogleLogin = async (targetEmail: string) => {
    const trimmed = targetEmail.trim().toLowerCase();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Kiểm tra email ủy quyền
      if (!isAuthorizedAdminEmail(trimmed)) {
        soundEffects.playClick();
        setErrorMessage(
          `Tài khoản (${trimmed}) không có quyền Quản trị viên của Lớp 5B.2. Vui lòng sử dụng đúng tài khoản Gmail của Cô Kim Tiến (${AUTHORIZED_ADMIN_EMAIL}).`
        );
        setIsLoading(false);
        return;
      }

      // Kế thừa toàn bộ quyền Admin và State Management qua Context
      const result = await loginAsTeacherWithGoogle(
        trimmed,
        'Cô Kim Tiến (GVCN Lớp 5B.2)'
      );

      if (result.success) {
        soundEffects.playWorksheetComplete();
        setShowConfirmModal(false);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.message || 'Xác thực Google không thành công.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi kết nối xác thực Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Nút bấm Đăng nhập với Google chuẩn thiết kế nhận diện thương hiệu */}
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setShowConfirmModal(true);
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border-2 border-slate-200 hover:border-slate-300 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer group"
          title={`Đăng nhập bảo mật bằng Google (${AUTHORIZED_ADMIN_EMAIL})`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          ) : (
            /* Icon Google chính thức chuẩn màu SVG */
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}

          <div className="text-left flex-1 min-w-0">
            <span className="text-slate-800 font-extrabold group-hover:text-indigo-600 transition-colors">
              Đăng nhập với Google
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-500 font-medium ml-1.5">
              (Dành riêng cho Quản trị viên)
            </span>
          </div>
        </button>

        {/* Thông báo lỗi nếu email không được cấp quyền */}
        {errorMessage && (
          <div className="flex items-start space-x-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN TÀI KHOẢN GOOGLE CỦA QUẢN TRỊ VIÊN */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900">
                  Xác Thực Quản Trị Viên Google
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Hệ thống kiểm tra ủy quyền Lớp 5B.2 Vui Vẻ
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
              <div className="text-xs font-bold text-slate-700">
                Tài khoản Gmail của Quản trị viên:
              </div>

              {/* Thẻ hiển thị tài khoản ủy quyền */}
              <div
                onClick={() => handleProceedGoogleLogin(AUTHORIZED_ADMIN_EMAIL)}
                className="flex items-center justify-between p-3 rounded-xl bg-white border-2 border-indigo-500/40 hover:border-indigo-600 hover:bg-indigo-50/50 cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                    KT
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">
                      Cô Kim Tiến (GVCN)
                    </div>
                    <div className="text-[11px] font-bold text-indigo-600 truncate">
                      {AUTHORIZED_ADMIN_EMAIL}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded-full shrink-0">
                  Ủy quyền
                </span>
              </div>

              {/* Hoặc kiểm tra email khác */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Hoặc nhập địa chỉ Gmail khác để kiểm tra:
                </label>
                <input
                  type="email"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="nhap.email@gmail.com"
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium leading-relaxed bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-amber-900">
              🔒 <strong>Bảo mật:</strong> Chỉ có địa chỉ Gmail chính thức ({AUTHORIZED_ADMIN_EMAIL}) mới được cấp quyền Quản trị viên (Admin). Các tài khoản khác sẽ bị từ chối truy cập.
            </div>

            {errorMessage && (
              <div className="flex items-start space-x-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isLoading || !customEmailInput}
                onClick={() => handleProceedGoogleLogin(customEmailInput)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận & Vào</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
