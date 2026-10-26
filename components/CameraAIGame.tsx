import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { CAMERA_CHALLENGES } from '../data/initialData';
import { CameraChallenge } from '../types';
import { sounds } from '../utils/audio';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Camera,
  Sparkles,
  Award,
  Video,
  VideoOff,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Coins,
  Smile,
  ShieldCheck,
  ChevronRight,
  Hand,
  Volume2,
  Lock,
  Unlock,
  AlertTriangle,
  MonitorSmartphone,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Laptop
} from 'lucide-react';

export type CameraPermissionState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'prompt';

export type CameraErrorCategory =
  | 'permission_denied'
  | 'device_not_found'
  | 'device_busy'
  | 'security_blocked'
  | 'unsupported_browser'
  | 'overconstrained'
  | 'general';

interface ErrorDetail {
  category: CameraErrorCategory;
  title: string;
  message: string;
  solution: string;
}

export const CameraAIGame: React.FC = () => {
  const { currentStudent, awardCoins } = useClassroom();

  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('idle');
  const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    recognizedAction?: string;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [motionTiltSide, setMotionTiltSide] = useState<'left' | 'right' | 'center'>('center');
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);

  const currentChallenge: CameraChallenge = CAMERA_CHALLENGES[currentChallengeIndex];

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Classify getUserMedia error with elementary & school-friendly guidance
  const classifyMediaError = (err: any): ErrorDetail => {
    const errorName = err?.name || '';
    const errorMsg = String(err?.message || '');

    if (
      errorName === 'NotAllowedError' ||
      errorName === 'PermissionDeniedError' ||
      errorMsg.toLowerCase().includes('permission denied') ||
      errorMsg.toLowerCase().includes('not allowed')
    ) {
      return {
        category: 'permission_denied',
        title: 'Quyền Camera Bị Từ Chối Hoặc Bị Chặn',
        message: 'Trình duyệt đang chặn truy cập webcam của bạn. Đừng lo lắng! Bé vẫn có thể chơi đầy đủ bằng chế độ tương tác phía dưới.',
        solution: 'Bấm biểu tượng 🔒 Ổ Khóa hoặc 📷 Camera trên thanh địa chỉ URL của trình duyệt, chọn "Cho phép" (Allow), sau đó bấm "Thử kết nối lại".'
      };
    }

    if (
      errorName === 'NotFoundError' ||
      errorName === 'DevicesNotFoundError' ||
      errorMsg.toLowerCase().includes('not found')
    ) {
      return {
        category: 'device_not_found',
        title: 'Không Tìm Thấy Thiết Bị Camera / Webcam',
        message: 'Máy tính hiện không có webcam hoặc thiết bị camera chưa được cắm dây cáp kết nối.',
        solution: 'Hãy kiểm tra lại cáp webcam USB hoặc chuyển ngay sang "Chế độ Tương Tác" không cần camera để tiếp tục học tập!'
      };
    }

    if (
      errorName === 'NotReadableError' ||
      errorName === 'TrackStartError' ||
      errorMsg.toLowerCase().includes('could not start')
    ) {
      return {
        category: 'device_busy',
        title: 'Camera Đang Bị Ứng Dụng Khác Chiếm Dụng',
        message: 'Một ứng dụng khác (Zoom, Google Meet, Microsoft Teams, Zalo...) đang dùng camera.',
        solution: 'Hãy tắt hoặc tạm dừng camera ở các ứng dụng khác rồi bấm nút "Thử kết nối lại" nhé!'
      };
    }

    if (
      errorName === 'SecurityError' ||
      errorMsg.toLowerCase().includes('insecure context') ||
      errorMsg.toLowerCase().includes('policy')
    ) {
      return {
        category: 'security_blocked',
        title: 'Bảo Mật Trình Duyệt / Khung Nhúng Chặn Quyền',
        message: 'Trình duyệt yêu cầu kết nối bảo mật HTTPS hoặc quyền cấp trong khung iFrame.',
        solution: 'Hãy sử dụng Chế độ Tương Tác Giả Lập bên dưới — bé vẫn nhận đủ 100% Xu thưởng và cúp vinh danh!'
      };
    }

    if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
      return {
        category: 'overconstrained',
        title: 'Độ Phân Giải Không Tương Thích',
        message: 'Thiết bị camera không hỗ trợ độ phân giải yêu cầu.',
        solution: 'Hệ thống sẽ tự động thử lại với cấu hình mặc định cơ bản.'
      };
    }

    return {
      category: 'general',
      title: 'Không Thể Mở Camera',
      message: errorMsg || 'Đã xảy ra sự cố kết nối tới camera.',
      solution: 'Bé có thể bấm "Chơi Tương Tác" để tham gia bài học ngay mà không cần đợi camera!'
    };
  };

  // Robust Camera Permission Handler
  const startCamera = async () => {
    stopCamera();
    setErrorDetail(null);
    setPermissionState('requesting');

    // 1. Check browser context security
    if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost') {
      const detail: ErrorDetail = {
        category: 'security_blocked',
        title: 'Kết Nối Chưa An Toàn (HTTPS Required)',
        message: 'Quyền Camera chỉ hoạt động trên địa chỉ HTTPS an toàn hoặc localhost.',
        solution: 'Hãy tiếp tục dùng Chế độ Tương Tác Giả Lập — đầy đủ điểm số và phần thưởng!'
      };
      setErrorDetail(detail);
      setPermissionState('unsupported');
      setIsFallbackMode(true);
      return;
    }

    // 2. Check if mediaDevices API is supported
    if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const detail: ErrorDetail = {
        category: 'unsupported_browser',
        title: 'Trình Duyệt Chưa Hỗ Trợ WebRTC Camera',
        message: 'Trình duyệt hoặc khung hiển thị hiện tại không hỗ trợ API navigator.mediaDevices.',
        solution: 'Chuyển sang Chế độ Tương Tác Giả Lập bên dưới để bé tham gia trắc nghiệm vận động.'
      };
      setErrorDetail(detail);
      setPermissionState('unsupported');
      setIsFallbackMode(true);
      return;
    }

    // 3. Attempt with ideal constraints first
    let stream: MediaStream | null = null;
    try {
      const idealConstraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
        },
        audio: false,
      };
      stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
    } catch (firstErr: any) {
      console.warn('Initial ideal constraints failed, trying basic fallback constraint:', firstErr);
      // If it's a constraint issue, attempt minimal fallback
      if (
        firstErr.name === 'OverconstrainedError' ||
        firstErr.name === 'ConstraintNotSatisfiedError' ||
        firstErr.name === 'TypeError'
      ) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (secondErr: any) {
          handleCameraError(secondErr);
          return;
        }
      } else {
        handleCameraError(firstErr);
        return;
      }
    }

    // 4. Stream successfully obtained
    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Play rejection (e.g. autoplay policy) can be ignored
        }
      }
      setCameraActive(true);
      setPermissionState('granted');
      setErrorDetail(null);
      setIsFallbackMode(false);
      sounds.playCorrect();
    }
  };

  const handleCameraError = (err: any) => {
    console.warn('Camera request error:', err);
    const detail = classifyMediaError(err);
    setErrorDetail(detail);
    setPermissionState(detail.category === 'permission_denied' ? 'denied' : 'unsupported');
    setCameraActive(false);
    // Automatically switch to fallback mode so students never get stuck!
    setIsFallbackMode(true);
    soundEffects.playClick();
  };

  // Monitor Permissions API for runtime camera privilege changes
  useEffect(() => {
    let isMounted = true;

    if (navigator?.permissions?.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((status) => {
          if (!isMounted) return;
          permissionStatusRef.current = status;

          if (status.state === 'granted') {
            setPermissionState('granted');
          } else if (status.state === 'denied') {
            setPermissionState('denied');
          } else {
            setPermissionState('prompt');
          }

          status.onchange = () => {
            if (!isMounted) return;
            if (status.state === 'granted') {
              setPermissionState('granted');
              setErrorDetail(null);
            } else if (status.state === 'denied') {
              setPermissionState('denied');
              stopCamera();
              setIsFallbackMode(true);
            } else {
              setPermissionState('prompt');
            }
          };
        })
        .catch(() => {
          // Permissions.query for 'camera' is not supported on all browsers (e.g. Safari)
        });
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Sync stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Motion Detection loop on canvas for Body Tilt / Hand Raise (Optimized with rAF)
  useEffect(() => {
    if (!cameraActive) return;

    let prevFrame: ImageData | null = null;
    let animId: number | null = null;
    let lastProcessedTime = performance.now();

    if (canvasRef.current) {
      canvasRef.current.width = 160;
      canvasRef.current.height = 120;
    }

    const processMotionFrame = (currentTime: number) => {
      // Throttle analysis to ~6 times/sec (160ms) to conserve CPU
      if (currentTime - lastProcessedTime >= 160) {
        lastProcessedTime = currentTime;

        if (
          videoRef.current &&
          canvasRef.current &&
          videoRef.current.readyState >= 2 &&
          videoRef.current.videoWidth > 0 &&
          videoRef.current.videoHeight > 0
        ) {
          try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
              ctx.drawImage(video, 0, 0, 160, 120);
              const currentFrame = ctx.getImageData(0, 0, 160, 120);

              if (prevFrame) {
                let leftMotion = 0;
                let rightMotion = 0;
                const data1 = prevFrame.data;
                const data2 = currentFrame.data;

                // Step by 16 for high-speed sampling
                for (let i = 0; i < data1.length; i += 16) {
                  const diff =
                    Math.abs(data1[i] - data2[i]) +
                    Math.abs(data1[i + 1] - data2[i + 1]) +
                    Math.abs(data1[i + 2] - data2[i + 2]);

                  if (diff > 45) {
                    const pixelIndex = i / 4;
                    const x = pixelIndex % 160;
                    if (x < 80) leftMotion++;
                    else rightMotion++;
                  }
                }

                if (leftMotion > rightMotion + 15 && leftMotion > 30) {
                  setMotionTiltSide('left');
                } else if (rightMotion > leftMotion + 15 && rightMotion > 30) {
                  setMotionTiltSide('right');
                } else {
                  setMotionTiltSide('center');
                }
              }

              prevFrame = currentFrame;
            }
          } catch {
            // Ignore temporary frame capture error
          }
        }
      }

      animId = requestAnimationFrame(processMotionFrame);
    };

    animId = requestAnimationFrame(processMotionFrame);

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [cameraActive]);

  // Evaluate action: supports both live camera snapshot & interactive fallback clicks
  const evaluateAction = async (forcedAnswerIndex?: number) => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setEvaluationResult(null);
    soundEffects.playClick();

    // Trigger visual camera shutter flash if camera is active
    if (cameraActive) {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 160);
    }

    // Fallback mode or explicit interactive selection
    if (!cameraActive || forcedAnswerIndex !== undefined) {
      setTimeout(() => {
        const chosen = forcedAnswerIndex !== undefined ? forcedAnswerIndex : 0;
        const isCorrect = chosen === currentChallenge.correctIndex;

        handleChallengeOutcome(
          isCorrect,
          isCorrect
            ? currentChallenge.explanation
            : 'Động tác chưa chính xác rồi, hãy thử lại cùng câu hỏi này nhé!',
          currentChallenge.options[chosen]
        );
        setIsEvaluating(false);
      }, 450);
      return;
    }

    // Live Snapshot from Camera
    let base64Image = '';
    try {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          base64Image = canvas.toDataURL('image/jpeg', 0.7);
        }
      }
    } catch (e) {
      console.warn('Canvas snapshot capture error:', e);
    }

    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 2500);

    try {
      const response = await fetch('/api/ai/evaluate-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          imageBase64: base64Image,
          challengeType: currentChallenge.challengeType,
          expectedAnswer: currentChallenge.expectedActionDesc,
          questionContext: currentChallenge.question,
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      if (data && data.result) {
        handleChallengeOutcome(
          data.result.isCorrect !== undefined ? Boolean(data.result.isCorrect) : true,
          data.result.feedback || currentChallenge.explanation,
          data.result.recognizedAction || currentChallenge.expectedActionDesc
        );
      } else {
        throw new Error('Heuristic outcome fallback');
      }
    } catch {
      clearTimeout(timeoutId);
      // Fallback with motion detection heuristic
      let isCorrect = true;
      if (currentChallenge.challengeType === 'body_tilt') {
        if (currentChallenge.correctIndex === 0) {
          isCorrect = motionTiltSide === 'left' || motionTiltSide === 'center';
        } else {
          isCorrect = motionTiltSide === 'right';
        }
      }
      handleChallengeOutcome(
        isCorrect,
        isCorrect ? currentChallenge.explanation : 'Hãy giữ yên động tác rõ hơn trước camera nhé!',
        currentChallenge.expectedActionDesc
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleChallengeOutcome = (isCorrect: boolean, feedback: string, recognizedAction?: string) => {
    setEvaluationResult({ isCorrect, feedback, recognizedAction });

    if (isCorrect) {
      soundEffects.playBigCoin();
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
      });
      setScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);

      if (currentStudent) {
        awardCoins(currentStudent.id, currentChallenge.rewardCoins || 5, 'Trò chơi Camera AI');
      }
    } else {
      sounds.playWrong();
      setStreak(0);
    }
  };

  const nextChallenge = () => {
    setEvaluationResult(null);
    setCurrentChallengeIndex((prev) => (prev + 1) % CAMERA_CHALLENGES.length);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Trò Chơi Tương Tác Camera AI
              </h1>
              <span className="bg-cyan-100 text-cyan-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Vận Động & Phản Xạ Tư Duy</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Học sinh vận động cơ thể, giơ ngón tay hoặc nghiêng người để trả lời cùng Trợ Lý Camera AI — tích lũy điểm Xu thưởng cho Lớp 5B.2!
            </p>
          </div>

          {/* Gamification Stats */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-amber-800">
                +{currentChallenge.rewardCoins} Xu / câu đúng
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-2xl">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-black text-orange-800">
                Streak: {streak} 🔥
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera View / Fallback Arena (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-4 sm:p-6 border-4 border-cyan-400/40 shadow-xl flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden">
          {/* Top Status Bar in Stage */}
          <div className="w-full flex items-center justify-between z-20 text-white text-xs font-bold gap-2">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  cameraActive
                    ? 'bg-emerald-400 animate-pulse'
                    : isFallbackMode
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span>
                {cameraActive
                  ? 'Camera AI: Đang Bật'
                  : isFallbackMode
                  ? 'Chế Độ Tương Tác: Hoạt Động'
                  : 'Camera AI: Đang Tắt'}
              </span>
            </div>

            {currentChallenge.challengeType === 'body_tilt' && cameraActive && (
              <div className="bg-cyan-500/80 text-white px-3 py-1 rounded-full text-xs font-black animate-pulse">
                Hướng nghiêng: {motionTiltSide === 'left' ? '👈 Trái (ĐÚNG)' : motionTiltSide === 'right' ? '👉 Phải (SAI)' : 'Giữa'}
              </div>
            )}

            {/* Quick toggle to view permission instructions */}
            {permissionState === 'denied' && (
              <button
                onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Cách Bật Lại Camera</span>
                {showPermissionGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Collapsible Step-by-Step Browser Permission Guide */}
          {showPermissionGuide && errorDetail && (
            <div className="w-full mt-2 mb-2 p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-100 text-xs z-30 animate-in fade-in duration-200 shadow-xl space-y-2">
              <div className="flex items-center justify-between font-black text-amber-300">
                <span className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{errorDetail.title}</span>
                </span>
                <button
                  onClick={() => setShowPermissionGuide(false)}
                  className="text-amber-400 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-amber-900/50"
                >
                  Đóng ✕
                </button>
              </div>
              <p className="text-amber-200 leading-relaxed font-medium">
                {errorDetail.solution}
              </p>
              <div className="bg-black/40 rounded-xl p-2.5 space-y-1.5 text-[11px] text-amber-100/90 border border-amber-500/20">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center font-bold text-amber-300 shrink-0">1</span>
                  <span>Nhấn vào biểu tượng 🔒 hoặc 📷 ở bên trái thanh địa chỉ trình duyệt.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center font-bold text-amber-300 shrink-0">2</span>
                  <span>Chuyển quyền Máy ảnh (Camera) từ "Chặn" sang <strong>"Cho phép" (Allow)</strong>.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center font-bold text-amber-300 shrink-0">3</span>
                  <span>Bấm nút <strong>"Thử Kết Nối Lại Camera"</strong> ở bên dưới.</span>
                </div>
              </div>
            </div>
          )}

          {/* Video Stream & AR Overlays OR Fallback Interactive Stage */}
          <div className="relative w-full aspect-4/3 max-w-lg rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center my-3 border-2 border-cyan-500/50 shadow-inner">
            {/* Shutter flash effect */}
            {flashActive && (
              <div className="absolute inset-0 bg-white pointer-events-none z-30 animate-out fade-out duration-150" />
            )}

            {/* Hidden permanent video and canvas tags */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                cameraActive ? 'block' : 'hidden'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Active Camera Mode */}
            {cameraActive ? (
              <>
                {/* AR Grid & Zones Overlay for Elementary Children */}
                {currentChallenge.challengeType === 'body_tilt' ? (
                  <div className="absolute inset-0 grid grid-cols-2 pointer-events-none">
                    <div
                      className={`border-r-2 border-dashed border-white/40 flex items-center justify-center transition-colors ${
                        motionTiltSide === 'left' ? 'bg-emerald-500/25' : 'bg-emerald-500/5'
                      }`}
                    >
                      <div className="bg-emerald-600/90 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow">
                        👈 NGHIÊNG TRÁI: ĐÚNG
                      </div>
                    </div>
                    <div
                      className={`flex items-center justify-center transition-colors ${
                        motionTiltSide === 'right' ? 'bg-rose-500/25' : 'bg-rose-500/5'
                      }`}
                    >
                      <div className="bg-rose-600/90 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow">
                        👉 NGHIÊNG PHẢI: SAI
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-52 h-52 border-2 border-dashed border-cyan-300 rounded-3xl animate-pulse flex items-center justify-center bg-cyan-400/5">
                      <span className="text-cyan-200 text-xs font-bold bg-black/60 px-2.5 py-1 rounded-lg">
                        🎯 Vùng nhận diện bàn tay / cử chỉ
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : isFallbackMode ? (
              /* Fallback Interactive Simulator Arena */
              <div className="w-full h-full p-4 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 to-indigo-950/80 text-center z-10">
                <div className="w-full flex items-center justify-between text-xs pb-1">
                  <span className="inline-flex items-center space-x-1 bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30 text-[11px] font-bold">
                    <MonitorSmartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mô Phỏng Tương Tác Học Tập</span>
                  </span>
                  <span className="text-amber-300 text-[11px] font-black flex items-center space-x-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đầy đủ +{currentChallenge.rewardCoins} Xu</span>
                  </span>
                </div>

                {/* Challenge specific interactive action simulators */}
                <div className="w-full my-auto space-y-3">
                  <p className="text-xs text-indigo-200 font-bold">
                    Bé hãy thực hiện cử chỉ mô phỏng tương ứng:
                  </p>

                  {currentChallenge.challengeType === 'body_tilt' ? (
                    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                      <button
                        onClick={() => evaluateAction(0)}
                        disabled={isEvaluating}
                        className="p-3.5 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/50 border-2 border-emerald-400/80 text-emerald-100 flex flex-col items-center justify-center space-y-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                      >
                        <span className="text-3xl">🤸‍♂️ 👈</span>
                        <span className="text-xs font-black text-emerald-200">
                          {currentChallenge.options[0] || 'Nghiêng Sang Trái'}
                        </span>
                        <span className="text-[10px] text-emerald-300/80 bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          Bấm chọn
                        </span>
                      </button>

                      <button
                        onClick={() => evaluateAction(1)}
                        disabled={isEvaluating}
                        className="p-3.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600/50 border-2 border-rose-400/80 text-rose-100 flex flex-col items-center justify-center space-y-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                      >
                        <span className="text-3xl">👉 🤸‍♀️</span>
                        <span className="text-xs font-black text-rose-200">
                          {currentChallenge.options[1] || 'Nghiêng Sang Phải'}
                        </span>
                        <span className="text-[10px] text-rose-300/80 bg-rose-950/60 px-2 py-0.5 rounded-full">
                          Bấm chọn
                        </span>
                      </button>
                    </div>
                  ) : currentChallenge.challengeType === 'finger_choice' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-md mx-auto">
                      {currentChallenge.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => evaluateAction(idx)}
                          disabled={isEvaluating}
                          className="p-2.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-400/50 text-cyan-100 flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <span className="text-xl">
                            {idx === 0 ? '☝️' : idx === 1 ? '✌️' : idx === 2 ? '🤟' : '✋'}
                          </span>
                          <span className="text-[11px] font-bold line-clamp-1">{opt}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
                      {currentChallenge.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => evaluateAction(idx)}
                          disabled={isEvaluating}
                          className="w-full sm:w-auto flex-1 p-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-400/50 text-indigo-100 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          🖐️ {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Friendly notification regarding camera status */}
                <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
                  <span>Chế độ mô phỏng cho lớp học</span>
                  <button
                    onClick={startCamera}
                    className="text-cyan-400 hover:text-cyan-200 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Thử bật lại Camera</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Idle Screen before asking permission */
              <div className="text-center p-6 space-y-4 z-10">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700 shadow-md">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-base">
                    Bật Camera Để Trải Nghiệm Tương Tác AI
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Hệ thống nhận diện cử chỉ cơ thể giúp học sinh vừa học vừa vận động hào hứng!
                  </p>
                </div>

                {errorDetail && (
                  <div className="bg-amber-950/80 border border-amber-500/80 text-amber-200 text-xs rounded-xl p-3 text-left max-w-xs mx-auto space-y-1 shadow-md">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{errorDetail.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-200/90">{errorDetail.message}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    onClick={startCamera}
                    disabled={permissionState === 'requesting'}
                    className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm px-5 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    {permissionState === 'requesting' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang xin quyền...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Cho phép & Mở Camera</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsFallbackMode(true);
                      soundEffects.playClick();
                    }}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/60 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all cursor-pointer"
                  >
                    Chơi Tương Tác (Không Camera)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Outcome Banner on Left Screen */}
          {evaluationResult && (
            <div
              className={`w-full mb-3 rounded-2xl p-3 border animate-in slide-in-from-bottom-2 duration-200 z-20 ${
                evaluationResult.isCorrect
                  ? 'bg-emerald-950/85 border-emerald-400 text-emerald-100'
                  : 'bg-rose-950/85 border-rose-400 text-rose-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {evaluationResult.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-black text-xs sm:text-sm">
                    {evaluationResult.isCorrect ? 'Tuyệt Vời! Động Tác Đúng!' : 'Chưa Đúng Rồi!'}
                  </span>
                  {evaluationResult.isCorrect && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      +{currentChallenge.rewardCoins || 5} Xu
                    </span>
                  )}
                </div>
                <button
                  onClick={nextChallenge}
                  className="px-2.5 py-1 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-black text-[11px] transition-all active:scale-95 cursor-pointer"
                >
                  Tiếp theo ➜
                </button>
              </div>
              <p className="text-[11px] mt-1 text-slate-300 font-medium leading-relaxed">
                {evaluationResult.feedback}
              </p>
            </div>
          )}

          {/* Camera Controls & Action Button */}
          <div className="w-full flex items-center justify-between gap-3 z-20">
            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Tắt Camera
              </button>
            ) : isFallbackMode ? (
              <button
                onClick={startCamera}
                className="py-2.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Thử Mở Camera</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="py-2.5 px-3 rounded-xl bg-cyan-900/60 hover:bg-cyan-900 text-cyan-200 text-xs font-bold border border-cyan-700 transition-colors cursor-pointer"
              >
                Mở Camera
              </button>
            )}

            <button
              onClick={() => evaluateAction()}
              disabled={isEvaluating}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                isEvaluating
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25'
              }`}
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích cử chỉ...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>
                    {cameraActive ? 'Chụp & AI Chấm Động Tác Này!' : 'Mô Phỏng Trả Lời Câu Này!'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Challenge Details & Interactive Options (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Question Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-indigo-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-1 rounded-full">
                {currentChallenge.subject} • Câu {currentChallengeIndex + 1}/{CAMERA_CHALLENGES.length}
              </span>
              <button
                onClick={() => sounds.speakVietnamese(currentChallenge.question)}
                title="Đọc câu hỏi cho bé"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
              {currentChallenge.question}
            </h3>

            {/* Hint Box */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
              <Hand className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold">Cách làm với Camera AI: </span>
                <span className="font-medium text-amber-800">
                  {currentChallenge.expectedActionDesc}
                </span>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Các phương án lựa chọn:
              </p>
              {currentChallenge.options.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => evaluateAction(idx)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm font-bold ${
                    evaluationResult && idx === currentChallenge.correctIndex
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md border">
                    Chạm để chọn thử
                  </span>
                </div>
              ))}
            </div>

            {/* AI Evaluation Result Banner */}
            {evaluationResult && (
              <div
                className={`rounded-2xl p-4 border animate-in zoom-in-95 duration-200 ${
                  evaluationResult.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {evaluationResult.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <h4 className="font-black text-sm">
                    {evaluationResult.isCorrect ? 'Tuyệt Vời! Động Tác Chính Xác!' : 'Chưa Chính Xác Rồi!'}
                  </h4>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed font-medium">
                  {evaluationResult.feedback}
                </p>
                {evaluationResult.isCorrect && (
                  <p className="text-xs font-black text-amber-700 mt-2 flex items-center space-x-1">
                    <span>🪙 Đã thưởng +{currentChallenge.rewardCoins} Xu vào tài khoản!</span>
                  </p>
                )}
              </div>
            )}

            {/* Next Challenge Button */}
            <button
              onClick={nextChallenge}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Thử Thách Tiếp Theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Fallback Mode Info Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cơ chế bảo vệ & linh hoạt cho học sinh</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Khi lớp học dùng máy tính bàn không gắn webcam hoặc trình duyệt chặn camera, học sinh luôn có thể chuyển sang chế độ tương tác một chạm để trả lời câu hỏi và nhận đủ 100% Xu thưởng!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
