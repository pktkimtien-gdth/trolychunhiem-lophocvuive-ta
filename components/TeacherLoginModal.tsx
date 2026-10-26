import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { X, Lock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ChangeAdminPinModal } from './ChangeAdminPinModal';
import { AdminGoogleLoginButton } from './admin/AdminGoogleLoginButton';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { verifyTeacherPin, isDefaultPin } = useClassroom();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError(true);
      return;
    }
    if (verifyTeacherPin(pin)) {
      setError(false);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden transform transition-all">
          {/* Header - Tím hiện đại gradient */}
          <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 p-6 text-white relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 rounded-full p-2 transition-colors focus:outline-hidden"
              aria-label="Đóng"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white border border-white/25 shadow-inner">
                <Lock className="w-6 h-6 text-purple-100" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold tracking-wide text-purple-100 mb-1 border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                  Khu Vực Bảo Mật
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  Khu Vực Quản Trị Viên
                </h2>
                <p className="text-xs text-purple-200 font-medium mt-0.5">
                  Dành cho Giáo viên chủ nhiệm • Lớp 5B.2
                </p>
              </div>
            </div>
          </div>

          {/* Form Body - Tối giản, Bảo mật */}
          <div className="p-6 space-y-4">
            {/* Đăng nhập bằng Google dành riêng cho Quản trị viên (Cô Kim Tiến) */}
            <AdminGoogleLoginButton
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
            />

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Hoặc đăng nhập bằng mã PIN
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nhập mã PIN bảo mật của Quản trị viên
                </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Nhập mã PIN bảo mật..."
                  autoFocus
                  autoComplete="current-password"
                  className={`w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-50 border-2 ${
                    error
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                      : 'border-slate-200 focus:border-purple-600 focus:bg-white'
                  } focus:outline-hidden text-base font-semibold text-slate-800 tracking-wider transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {error && (
                <div className="flex items-center space-x-1.5 text-xs text-rose-600 font-bold mt-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mã PIN bảo mật không chính xác. Vui lòng thử lại!</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-purple-600/25 hover:shadow-purple-600/35 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Xác Thực & Đăng Nhập</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsChangePinOpen(true)}
                className="text-purple-700 hover:text-purple-900 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi Mã PIN Quản Trị</span>
              </button>

              <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bảo mật AES</span>
              </div>
            </div>
          </form>
          </div>
        </div>
      </div>

      {/* Modal Đổi Mã PIN Quản Trị Viên */}
      <ChangeAdminPinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSuccess={() => {
          setPin('');
          setError(false);
        }}
      />
    </>
  );
};


