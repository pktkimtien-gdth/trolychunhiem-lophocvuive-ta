import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  Monitor,
  X,
  CheckCircle2,
  HardDriveDownload,
  WifiOff,
  Sparkles,
  Info
} from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        // If dismissed or failed, show helper modal
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {isInstalled ? (
        <button
          onClick={() => setShowGuideModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          title="Ứng dụng Vui Đến Trường đã được cài đặt vào máy để sử dụng ngoại tuyến (Offline)"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">App Đã Cài Offline</span>
          <span className="sm:hidden">Đã Cài</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer active:scale-95"
          title="Cài đặt ứng dụng về máy để sử dụng ngoại tuyến ngay cả khi mất mạng Internet"
        >
          <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span className="hidden sm:inline">Cài Đặt App Offline</span>
          <span className="sm:hidden">Cài App</span>
        </button>
      )}

      {/* Installation & Offline Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-indigo-200 overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shrink-0">
                  <HardDriveDownload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base sm:text-lg">
                    {isInstalled ? 'Ứng Dụng Đã Cài Đặt Ngoại Tuyến' : 'Cài Đặt App Vui Đến Trường'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sử dụng trơn tru ngay cả khi không có kết nối Internet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Info */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start space-x-3">
                <WifiOff className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-emerald-950 text-xs sm:text-sm">
                    Tự Động Lưu Cache Ngoại Tuyến (Offline PWA)
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                    Toàn bộ danh sách 42 học sinh Lớp 5B.2, sơ đồ lớp học và ngân hàng phiếu bài tập đã được tải sẵn vào bộ nhớ thiết bị.
                  </p>
                </div>
              </div>

              {/* Instructions based on platform */}
              <div className="space-y-3 pt-1">
                <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cách cài đặt nhanh trên thiết bị của bạn:</span>
                </h5>

                {/* 1. Chrome / Edge / Laptop */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-xs">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Trên Máy tính (Chrome, Cốc Cốc, Edge):</span>
                    <span className="text-xs text-slate-600">
                      Nhấn vào biểu tượng <b>Cài đặt (Install ⊕)</b> ở góc phải thanh địa chỉ trình duyệt, hoặc mở Menu <b>⋮</b> chọn <b>"Cài đặt Vui Đến Trường"</b>.
                    </span>
                  </div>
                </div>

                {/* 2. Android Phone / Tablet */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 font-black flex items-center justify-center shrink-0 text-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Trên Điện thoại Android:</span>
                    <span className="text-xs text-slate-600">
                      Mở Menu trình duyệt Chrome <b>(biểu tượng 3 chấm ⋮)</b> &gt; chọn <b>"Thêm vào Màn hình chính"</b> hoặc <b>"Cài đặt ứng dụng"</b>.
                    </span>
                  </div>
                </div>

                {/* 3. iOS iPhone / iPad */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0 text-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Trên iPhone / iPad (Safari):</span>
                    <span className="text-xs text-slate-600">
                      Bấm nút <b>Chia sẻ (Share ⎋)</b> ở thanh công cụ dưới &gt; cuộn xuống và chọn <b>"Thêm vào MH chính (Add to Home Screen)"</b>.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all text-center cursor-pointer active:scale-95"
                >
                  Cài Đặt Ngay Vào Thiết Bị
                </button>
              )}
              <button
                onClick={() => setShowGuideModal(false)}
                className={`${isInstallable ? 'w-auto px-5' : 'w-full'} py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all text-center cursor-pointer`}
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
