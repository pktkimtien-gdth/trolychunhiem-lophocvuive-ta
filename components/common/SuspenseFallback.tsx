import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface SuspenseFallbackProps {
  title?: string;
  subtitle?: string;
  minimal?: boolean;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  title = 'Đang tải dữ liệu lớp học...',
  subtitle = 'Vui lòng chờ trong giây lát để hệ thống khởi tạo giao diện',
  minimal = false,
}) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-6 text-slate-500 gap-2.5 animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm font-bold text-slate-700">{title}</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[380px] p-8 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs rounded-3xl border border-slate-200/80 shadow-xs animate-pulse">
      {/* Icon spinner */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs shadow-xs animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Text Info */}
      <h4 className="text-base sm:text-lg font-black text-slate-800 tracking-tight mb-1 text-center">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-slate-500 text-center max-w-sm mb-6">
        {subtitle}
      </p>

      {/* Skeleton placeholders */}
      <div className="w-full max-w-md space-y-3">
        <div className="h-3.5 bg-slate-200/80 rounded-full w-3/4 mx-auto" />
        <div className="h-3 bg-slate-100 rounded-full w-1/2 mx-auto" />
      </div>
    </div>
  );
};
