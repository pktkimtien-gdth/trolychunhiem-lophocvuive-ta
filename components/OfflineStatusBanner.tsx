import React, { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, X, Database, CheckCircle2 } from 'lucide-react';

export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // If user is online and wasn't recently offline, render nothing
  if (isOnline && !wasOffline) {
    return null;
  }

  // If user explicitly dismissed the banner during this offline session
  if (dismissed && !isOnline) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 transition-all duration-300">
      {!isOnline ? (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center space-x-2.5 max-w-5xl mx-auto flex-1">
            <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse text-white" />
            </div>
            <div className="flex-1">
              <span className="font-black mr-1">Chế độ Ngoại Tuyến (Offline):</span>
              <span>
                Mất kết nối mạng nhưng bạn vẫn có thể xem <b>Bảng điểm 42 học sinh</b>, làm <b>Bài tập theo tuần</b> và quản lý lớp học. Dữ liệu được lưu an toàn trong máy.
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-black/15 rounded-lg text-xs font-semibold shrink-0">
              <Database className="w-3.5 h-3.5 text-amber-100" />
              <span>Service Worker Active</span>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors ml-2"
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 shadow-md flex items-center justify-center text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <Wifi className="w-4 h-4 text-emerald-100" />
            <span>Đã kết nối Internet trở lại! Dữ liệu bảng điểm và bài tập sẵn sàng đồng bộ.</span>
          </div>
        </div>
      )}
    </div>
  );
};
