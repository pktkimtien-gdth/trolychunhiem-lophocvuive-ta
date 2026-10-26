import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { X, Users, HeartHandshake, CheckCircle } from 'lucide-react';

interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ParentModal: React.FC<ParentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { students, setActiveParentStudentId, setRole } = useClassroom();
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentSelected = students.find((s) => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelected) return;

    // Verify PIN or allow parent access
    if (!currentSelected.parentPin || pin === currentSelected.parentPin || pin === '1234') {
      setActiveParentStudentId(currentSelected.id);
      setRole('parent');
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('Mã PIN phụ huynh chưa chính xác. Gợi ý: mã mặc định ' + currentSelected.parentPin);
    }
  };

  const handleQuickAccess = (studentId: string) => {
    setActiveParentStudentId(studentId);
    setRole('parent');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-emerald-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">Cổng Theo Dõi Phụ Huynh</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Theo dõi kết quả học tập, thời khóa biểu và điểm rèn luyện của học sinh Lớp 5B.2
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chọn học sinh cần xem:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm focus:outline-hidden"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mã PIN bảo mật phụ huynh
              </label>
              {currentSelected && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Mã PIN: {currentSelected.parentPin || '1234'}
                </span>
              )}
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={`Nhập mã (Gợi ý: ${currentSelected?.parentPin || '1234'})`}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm focus:outline-hidden"
            />
            {error && <p className="text-xs font-bold text-red-500 mt-1">{error}</p>}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex items-start space-x-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Kết nối mật thiết Gia đình & Nhà trường</p>
              <p className="text-emerald-700 mt-0.5">
                Xem ngay bảng điểm tự động chấm, lịch sử đổi quà và những nỗ lực học tập của học sinh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleQuickAccess(selectedStudentId)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-sm transition-colors text-center cursor-pointer"
            >
              Xem ngay hồ sơ
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/30 transition-all text-center cursor-pointer"
            >
              Xác thực & Vào
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
