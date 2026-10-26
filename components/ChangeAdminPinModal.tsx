import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import {
  X,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ChangeAdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangeAdminPinModal: React.FC<ChangeAdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { changeTeacherPin, isDefaultPin } = useClassroom();

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Real-time validation checks
  const isDigitsOnly = newPin.length === 0 || /^\d+$/.test(newPin);
  const hasMinLength = newPin.length >= 6;
  const isMatched = confirmPin.length > 0 && newPin === confirmPin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!oldPin.trim() || !newPin.trim() || !confirmPin.trim()) {
      setError('Vui lòng nhập đầy đủ cả 3 ô: Mã PIN cũ, Mã PIN mới và Xác nhận.');
      return;
    }

    if (!/^\d+$/.test(newPin.trim())) {
      setError('Mã PIN mới chỉ được phép chứa các chữ số (0-9).');
      return;
    }

    if (newPin.trim().length < 6) {
      setError('Mã PIN mới phải có tối thiểu 6 chữ số để đảm bảo an toàn.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('Xác nhận mã PIN mới không khớp với mã PIN mới.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeTeacherPin(oldPin, newPin, confirmPin);
      if (result.success) {
        setSuccessMsg(result.message);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
        }, 1800);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Có lỗi xảy ra khi cập nhật mã PIN. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden transform transition-all">
        {/* Header - Tím hiện đại */}
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
              <KeyRound className="w-6 h-6 text-purple-100" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold tracking-wide text-purple-100 mb-1 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                Bảo Mật Tài Khoản
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Đổi Mã PIN Quản Trị
              </h2>
              <p className="text-xs text-purple-200 font-medium mt-0.5">
                Thiết lập mật khẩu bảo vệ riêng cho Cô Kim Tiến
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông báo nếu đang dùng PIN mặc định */}
          {isDefaultPin && !successMsg && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Khuyến cáo an toàn:</span> Hệ thống đang dùng mã PIN mặc định. Cô vui lòng đổi sang mã PIN bí mật mới (tối thiểu 6 số) để bảo vệ lớp học.
              </div>
            </div>
          )}

          {/* Ô 1: Mã PIN Cũ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Mã PIN cũ hiện tại
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPin}
                onChange={(e) => {
                  setOldPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập mã PIN cũ..."
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-purple-600 focus:bg-white focus:outline-hidden text-sm font-semibold text-slate-800 tracking-wider transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-600 rounded-lg transition-colors focus:outline-hidden"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Ô 2: Mã PIN Mới */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Mã PIN mới (≥ 6 chữ số)
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ví dụ: 892156 (chỉ nhập số)"
                autoComplete="new-password"
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-purple-600 focus:bg-white focus:outline-hidden text-sm font-semibold text-slate-800 tracking-wider transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-600 rounded-lg transition-colors focus:outline-hidden"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checklist tiêu chí mật khẩu */}
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500">
              <div className={`flex items-center space-x-1 ${isDigitsOnly && newPin.length > 0 ? 'text-emerald-600 font-bold' : ''}`}>
                <Check className={`w-3.5 h-3.5 ${isDigitsOnly && newPin.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Chỉ ký tự số (0-9)</span>
              </div>
              <div className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-600 font-bold' : ''}`}>
                <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Từ 6 chữ số trở lên</span>
              </div>
            </div>
          </div>

          {/* Ô 3: Xác nhận Mã PIN Mới */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Xác nhận Mã PIN mới
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập lại chính xác mã PIN mới..."
                autoComplete="new-password"
                className={`w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50 border-2 ${
                  confirmPin.length > 0 && !isMatched
                    ? 'border-rose-300 bg-rose-50/30'
                    : isMatched
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-200 focus:border-purple-600 focus:bg-white'
                } focus:outline-hidden text-sm font-semibold text-slate-800 tracking-wider transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-600 rounded-lg transition-colors focus:outline-hidden"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPin.length > 0 && (
              <p className={`text-[11px] font-bold mt-1.5 flex items-center space-x-1 ${isMatched ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isMatched ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mã PIN xác nhận đã trùng khớp hoàn toàn!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Mã xác nhận chưa khớp với mã PIN mới.</span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-600 font-bold p-2.5 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMsg && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold p-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors text-center cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isMatched || !hasMinLength}
              className={`flex-1 py-3 px-4 rounded-2xl text-white font-bold text-sm shadow-md transition-all text-center flex items-center justify-center space-x-2 ${
                isSubmitting || !isMatched || !hasMinLength
                  ? 'bg-purple-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/30 cursor-pointer active:scale-[0.99]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Mã PIN Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
