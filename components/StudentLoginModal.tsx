import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { X, Search, Sparkles, Smile, ArrowRight } from 'lucide-react';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({ isOpen, onClose }) => {
  const { students, selectStudentLogin } = useClassroom();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSelect = (id: string) => {
    selectStudentLogin(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
              🎒
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Em Là Ai? Chạm Vào Tên Mình Nhé!
              </h2>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                Không cần nhớ mật khẩu khó nhằn — Chạm nhẹ để bắt đầu tiết học vui nhộn!
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên em (Ví dụ: Huy, Hân, Nam, My...)"
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:outline-hidden text-sm font-bold text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <span className="text-xs font-bold text-amber-700 px-3 py-2 bg-amber-100 rounded-xl whitespace-nowrap">
            {filtered.length} bạn
          </span>
        </div>

        {/* Student Avatar Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((student) => (
            <button
              key={student.id}
              onClick={() => handleSelect(student.id)}
              className="group relative flex flex-col items-center p-3.5 rounded-2xl bg-slate-50 hover:bg-gradient-to-b hover:from-amber-50 hover:to-orange-50 border-2 border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all transform hover:-translate-y-1 text-center"
            >
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 border-2 border-amber-200 group-hover:border-amber-400 shadow-sm my-2 flex items-center justify-center overflow-hidden">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Name */}
              <span className="font-extrabold text-sm text-slate-800 group-hover:text-amber-800 line-clamp-1">
                {student.name}
              </span>

              {/* Points Pill */}
              <div className="mt-1 flex items-center space-x-1.5 bg-amber-100/80 px-2 py-0.5 rounded-full text-xs font-black text-amber-800">
                <span>🪙 {student.coins} xu</span>
                <span>•</span>
                <span>⭐ {student.stars}</span>
              </div>

              <div className="mt-2 text-[11px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
                <span>Vào lớp</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Smile className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">Không tìm thấy bạn nào với tên này</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm nhé!</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
          💡 Chọn đúng tên của mình để được cộng điểm và tích xu vào túi quà nhé!
        </div>
      </div>
    </div>
  );
};
