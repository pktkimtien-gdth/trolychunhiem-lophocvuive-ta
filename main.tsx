import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

/**
 * Kiểm tra tính toàn vẹn kết nối mạng trước khi cập nhật Service Worker:
 * - Kiểm tra trạng thái navigator.onLine
 * - Kiểm tra Network Information API (effectiveType, rtt)
 * - Thực hiện ping probe với timeout để phát hiện mạng chập chờn / mất gói tin
 */
async function checkNetworkIntegrity(): Promise<{
  isHealthy: boolean;
  isFlaky: boolean;
  reason?: string;
}> {
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return { isHealthy: false, isFlaky: true, reason: 'Thiết bị đang ngoại tuyến (Offline)' };
  }

  // Kiểm tra thông tin đường truyền qua Network Information API nếu trình duyệt hỗ trợ
  const conn =
    (navigator as unknown as { connection?: { effectiveType?: string; rtt?: number; saveData?: boolean } }).connection ||
    (navigator as unknown as { mozConnection?: { effectiveType?: string; rtt?: number } }).mozConnection ||
    (navigator as unknown as { webkitConnection?: { effectiveType?: string; rtt?: number } }).webkitConnection;

  const isSlowConn = Boolean(
    conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || (conn.rtt && conn.rtt > 1500))
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const startTime = performance.now();

    // Probe nhẹ vào manifest để đo đạc tính toàn vẹn và độ trễ thực tế
    const res = await fetch('/manifest.webmanifest?probe=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = performance.now() - startTime;
    if (res.ok && latency < 2500 && !isSlowConn) {
      return { isHealthy: true, isFlaky: false };
    }

    return {
      isHealthy: false,
      isFlaky: true,
      reason: latency >= 2500 ? 'Độ trễ mạng cao (>2.5s)' : 'Tín hiệu đường truyền yếu',
    };
  } catch (err: unknown) {
    const isAbort = (err as { name?: string })?.name === 'AbortError';
    return {
      isHealthy: false,
      isFlaky: true,
      reason: isAbort ? 'Mạng chập chờn (vượt quá 3.5s kết nối)' : 'Mất gói tin kết nối',
    };
  }
}

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let activeNotificationElement: HTMLDivElement | null = null;

function removeExistingUpdateNotification() {
  if (activeNotificationElement) {
    activeNotificationElement.remove();
    activeNotificationElement = null;
  }
}

/**
 * Hiển thị thông báo kiểm tra tính toàn vẹn và tùy chọn cập nhật phiên bản mới
 */
function showUpdateNotification(isFlaky: boolean, reason?: string) {
  removeExistingUpdateNotification();

  const container = document.createElement('div');
  activeNotificationElement = container;
  container.className =
    'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92%] sm:w-auto p-4 rounded-3xl shadow-2xl border transition-all animate-in fade-in slide-in-from-top-4 duration-300 font-["Quicksand",sans-serif]';

  if (isFlaky) {
    // Trạng thái mạng chập chờn: Cảnh báo an toàn dữ liệu offline
    container.classList.add('bg-amber-50', 'border-amber-300', 'text-amber-950');
    container.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="p-2.5 bg-amber-200/80 rounded-2xl text-amber-800 text-xl shrink-0">
          ⚠️
        </div>
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between">
            <h4 class="font-black text-sm text-amber-900">
              Có Bản Cập Nhật Mới • Mạng Chập Chờn
            </h4>
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800">
              ${reason || 'Kết nối yếu'}
            </span>
          </div>
          <p class="text-xs text-amber-800 font-medium leading-relaxed">
            Hệ thống phát hiện phiên bản mới nhưng đường truyền mạng không ổn định. Để đảm bảo <b>bảng điểm 42 học sinh và bài tập không bị gián đoạn</b>, ứng dụng đang bảo vệ dữ liệu offline an toàn.
          </p>
          <div class="flex items-center gap-2 pt-2">
            <button
              id="pwa-retry-update-btn"
              class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              🔄 Kiểm tra & Cập nhật lại
            </button>
            <button
              id="pwa-dismiss-btn"
              class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tiếp tục dùng Offline
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Mạng ổn định: Sẵn sàng cập nhật tức thì
    container.classList.add('bg-indigo-50', 'border-indigo-300', 'text-indigo-950');
    container.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="p-2.5 bg-indigo-100 rounded-2xl text-indigo-700 text-xl shrink-0">
          ✨
        </div>
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between">
            <h4 class="font-black text-sm text-indigo-900">
              Phiên Bản Lớp Học 5B.2 Mới Đã Sẵn Sàng!
            </h4>
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Mạng Ổn Định ✓
            </span>
          </div>
          <p class="text-xs text-indigo-700 font-medium leading-relaxed">
            Kết nối mạng tốt và toàn vẹn dữ liệu đã được xác thực. Bạn có thể làm mới ứng dụng ngay để trải nghiệm tính năng mới nhất.
          </p>
          <div class="flex items-center gap-2 pt-2">
            <button
              id="pwa-apply-update-btn"
              class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              ⚡ Cập Nhật Ngay
            </button>
            <button
              id="pwa-dismiss-btn"
              class="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    `;
  }

  document.body.appendChild(container);

  // Gắn sự kiện nút
  const applyBtn = container.querySelector('#pwa-apply-update-btn');
  const retryBtn = container.querySelector('#pwa-retry-update-btn');
  const dismissBtn = container.querySelector('#pwa-dismiss-btn');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyBtn.textContent = 'Đang đồng bộ...';
      if (updateServiceWorker) {
        updateServiceWorker(true);
      } else {
        window.location.reload();
      }
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      retryBtn.textContent = 'Đang đo đạc mạng...';
      const check = await checkNetworkIntegrity();
      if (check.isHealthy && updateServiceWorker) {
        showUpdateNotification(false);
      } else {
        showUpdateNotification(true, check.reason || 'Mạng vẫn chập chờn');
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      removeExistingUpdateNotification();
    });
  }
}

/**
 * Quy trình xác thực tính toàn vẹn và thông báo cập nhật
 */
async function verifyAndPromptUpdate() {
  const integrity = await checkNetworkIntegrity();

  // Phát custom event để các component React khác (nếu cần) lắng nghe
  window.dispatchEvent(
    new CustomEvent('pwa-update-integrity-check', {
      detail: {
        isHealthy: integrity.isHealthy,
        isFlaky: integrity.isFlaky,
        reason: integrity.reason,
      },
    })
  );

  if (integrity.isFlaky) {
    console.warn(`[PWA] Phát hiện phiên bản mới nhưng mạng chập chờn: ${integrity.reason}. Duy trì offline cache an toàn.`);
    showUpdateNotification(true, integrity.reason);
  } else {
    console.log('[PWA] Tính toàn vẹn kết nối mạng tốt. Hiển thị thông báo cập nhật phiên bản mới.');
    showUpdateNotification(false);
  }
}

// Đăng ký Service Worker với kiểm tra tính toàn vẹn kết nối
updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Có phiên bản Service Worker mới sẵn sàng. Bắt đầu kiểm tra tính toàn vẹn mạng...');
    verifyAndPromptUpdate();
  },
  onOfflineReady() {
    console.log('[PWA] Ứng dụng đã lưu offline thành công! Bảng điểm và bài tập có thể truy cập không cần mạng.');
  },
  onRegisterError(error) {
    console.warn('[PWA] Đăng ký Service Worker gặp sự cố:', error);
  },
});

// Khi người dùng kết nối mạng trở lại, tự động kiểm tra tính toàn vẹn để sẵn sàng cập nhật
window.addEventListener('online', () => {
  console.log('[PWA] Phát hiện thiết bị đã kết nối mạng trở lại. Kiểm tra tính toàn vẹn...');
  checkNetworkIntegrity().then((result) => {
    if (result.isHealthy && activeNotificationElement) {
      showUpdateNotification(false);
    }
  });
});

createRoot(document.getElementById('root')!).render(<App />);
