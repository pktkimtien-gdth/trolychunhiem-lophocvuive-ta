import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  CheckCircle2,
  HelpCircle,
  Radio,
  ArrowRight,
  LayoutGrid,
  BookOpen,
  Gift,
  Clock,
  Camera,
  Library,
  Tv,
  Award,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { soundEffects } from '../utils/soundEffects';

// Interface for SpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface VoiceCommandListenerProps {
  activeTab: string;
  onNavigate: (tabKey: string) => void;
}

interface CommandTarget {
  tabKey: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  phrases: string[];
  responseMsg: string;
}

// Remove Vietnamese accents for resilient fuzzy matching
function removeVietnameseAccents(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

// Comprehensive registry of voice commands for Grade 5B.2
const VOICE_COMMANDS: CommandTarget[] = [
  {
    tabKey: 'seating',
    name: 'Sơ đồ lớp',
    icon: LayoutGrid,
    phrases: [
      'sơ đồ lớp',
      'sơ đồ lớp học',
      'sơ đồ',
      'chỗ ngồi',
      'bàn ghế',
      'xem sơ đồ',
      'so do lop',
      'cho ngoi',
      'ban ghe',
      'lop hoc'
    ],
    responseMsg: 'Đang mở Sơ đồ Lớp học 5B.2 cho bé!'
  },
  {
    tabKey: 'worksheets',
    name: 'Phiếu bài tập',
    icon: BookOpen,
    phrases: [
      'phiếu bài tập',
      'bài tập',
      'phiếu bài',
      'làm bài',
      'kho bài tập',
      'bài tập cuối tuần',
      'chấm điểm',
      'phieu bai tap',
      'bai tap',
      'lam bai',
      'kho bai'
    ],
    responseMsg: 'Đang mở Ngân hàng Phiếu bài tập cho bé!'
  },
  {
    tabKey: 'gifts',
    name: 'Cửa hàng',
    icon: Gift,
    phrases: [
      'cửa hàng',
      'đổi quà',
      'quà tặng',
      'cửa hàng quà',
      'đổi xu',
      'tiệm quà',
      'shop quà',
      'mua quà',
      'cua hang',
      'doi qua',
      'qua tang',
      'tiem qua'
    ],
    responseMsg: 'Đang mở Cửa hàng Đổi quà cho bé!'
  },
  {
    tabKey: 'picker',
    name: 'Quả lắc gọi tên',
    icon: Clock,
    phrases: [
      'quả lắc',
      'con lắc',
      'vòng quay',
      'gọi tên',
      'quay số',
      'đồng hồ quả lắc',
      'con lac',
      'qua lac',
      'vong quay',
      'goi ten'
    ],
    responseMsg: 'Đang mở Con lắc và Vòng quay Gọi tên!'
  },
  {
    tabKey: 'camera-ai',
    name: 'Camera AI',
    icon: Camera,
    phrases: [
      'camera',
      'camera ai',
      'trò chơi camera',
      'game camera',
      'nhận diện cử chỉ',
      'tro choi camera',
      'may anh'
    ],
    responseMsg: 'Đang mở Trò chơi Tương tác Camera AI!'
  },
  {
    tabKey: 'library',
    name: 'Thư viện sách',
    icon: Library,
    phrases: [
      'thư viện',
      'thư viện sách',
      'kệ sách',
      'đọc sách',
      'sách số',
      'sách',
      'thu vien',
      'ke sach',
      'doc sach'
    ],
    responseMsg: 'Đang mở Thư viện Sách số 3D!'
  },
  {
    tabKey: 'video-library',
    name: 'Video bài giảng',
    icon: Tv,
    phrases: [
      'video',
      'video bài giảng',
      'kho video',
      'xem video',
      'bài giảng',
      'hoat hinh',
      'kho video'
    ],
    responseMsg: 'Đang mở Kho Video Bài giảng AI!'
  },
  {
    tabKey: 'reports',
    name: 'Thời khóa biểu',
    icon: Award,
    phrases: [
      'thời khóa biểu',
      'thời khoá biểu',
      'báo cáo',
      'lịch học',
      'sổ điểm',
      'thoi khoa bieu',
      'lich hoc'
    ],
    responseMsg: 'Đang mở Thời khóa biểu và Báo cáo tổng kết!'
  }
];

export const VoiceCommandListener: React.FC<VoiceCommandListenerProps> = ({
  activeTab,
  onNavigate
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [matchedCommand, setMatchedCommand] = useState<CommandTarget | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldListenRef = useRef(false);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const customWindow = window as IWindow;
    const SpeechRecognition =
      customWindow.SpeechRecognition || customWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            currentFinal += text + ' ';
          } else {
            currentInterim += text;
          }
        }

        const candidate = (currentFinal || currentInterim).trim();
        setTranscript(candidate);
        setInterimTranscript(currentInterim);

        if (candidate) {
          evaluateVoiceCommand(candidate);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Quyền Microphone bị từ chối. Hãy bấm Cho phép để dùng giọng nói!');
          shouldListenRef.current = false;
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Normal pause in speech, will restart if shouldListen
        } else {
          setErrorMessage('Không nhận được âm thanh. Bé hãy thử nói lại nhé!');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if user hasn't explicitly stopped listening
        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                recognition.start();
              } catch {
                // Ignore start collision
              }
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setIsSupported(false);
    }

    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Evaluate candidate text against supported voice commands
  const evaluateVoiceCommand = useCallback(
    (rawText: string) => {
      const cleanRaw = rawText.toLowerCase().trim();
      const cleanNoAccent = removeVietnameseAccents(rawText);

      for (const cmd of VOICE_COMMANDS) {
        const isMatch = cmd.phrases.some((phrase) => {
          const phraseClean = phrase.toLowerCase().trim();
          const phraseNoAccent = removeVietnameseAccents(phrase);

          return (
            cleanRaw.includes(phraseClean) ||
            cleanNoAccent.includes(phraseNoAccent)
          );
        });

        if (isMatch) {
          // Trigger Navigation
          setMatchedCommand(cmd);
          soundEffects.playClick();

          // Spoken feedback in Vietnamese if enabled
          if (audioFeedbackEnabled) {
            sounds.speakVietnamese(cmd.responseMsg);
          }

          onNavigate(cmd.tabKey);

          // Clear matched banner after 3 seconds
          if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = setTimeout(() => {
            setMatchedCommand(null);
            setTranscript('');
          }, 3200);

          break;
        }
      }
    },
    [onNavigate, audioFeedbackEnabled]
  );

  // Toggle listening state
  const toggleListening = () => {
    if (!isSupported) {
      alert(
        'Trình duyệt chưa hỗ trợ Web Speech API. Bé hãy mở trang trên Google Chrome hoặc Microsoft Edge để dùng giọng nói nhé!'
      );
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      shouldListenRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      soundEffects.playClick();
    } else {
      shouldListenRef.current = true;
      setErrorMessage(null);
      setTranscript('');
      setInterimTranscript('');
      setMatchedCommand(null);
      setIsExpanded(true);
      try {
        recognitionRef.current.start();
        sounds.playCorrect();
      } catch (err: any) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Listen for open-voice-command event from Navbar or anywhere in the app
  useEffect(() => {
    const handleOpenVoice = () => {
      setIsExpanded(true);
      if (!shouldListenRef.current && recognitionRef.current) {
        shouldListenRef.current = true;
        setErrorMessage(null);
        setTranscript('');
        setInterimTranscript('');
        setMatchedCommand(null);
        try {
          recognitionRef.current.start();
          sounds.playCorrect();
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('open-voice-command', handleOpenVoice);
    return () => window.removeEventListener('open-voice-command', handleOpenVoice);
  }, []);

  // Direct click fallback on chips for kids
  const handleChipClick = (cmd: CommandTarget) => {
    soundEffects.playClick();
    if (audioFeedbackEnabled) {
      sounds.speakVietnamese(cmd.responseMsg);
    }
    setMatchedCommand(cmd);
    onNavigate(cmd.tabKey);
    setTimeout(() => setMatchedCommand(null), 2500);
  };

  return (
    <>
      {/* Floating Widget Container in Bottom-Right Corner */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none font-['Quicksand',sans-serif]">
        {/* Expanded Voice Command Panel */}
        {isExpanded && (
          <div className="pointer-events-auto mb-3 w-[92vw] max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md rounded-3xl border-2 border-indigo-200 shadow-2xl p-4 sm:p-5 animate-in slide-in-from-bottom-3 duration-200 text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-800 flex items-center space-x-1.5">
                    <span>Điều Khiển Bằng Giọng Nói</span>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      AI 5B.2
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Web Speech API • Nhận diện tiếng Việt
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                  title={audioFeedbackEnabled ? 'Tắt đọc phản hồi' : 'Bật đọc phản hồi'}
                  className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    audioFeedbackEnabled
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Listening Status & Sound Wave */}
            <div className="py-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span className={isListening ? 'text-rose-600 font-black' : 'text-slate-500'}>
                    {isListening ? 'Đang lắng nghe bé nói...' : 'Mic đang tạm dừng'}
                  </span>
                </div>

                {/* Animated sound bars when listening */}
                {isListening && (
                  <div className="flex items-center space-x-1 h-4">
                    <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce delay-75" />
                    <span className="w-1 h-4 bg-pink-500 rounded-full animate-bounce delay-150" />
                    <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce delay-100" />
                    <span className="w-1 h-4 bg-indigo-500 rounded-full animate-bounce delay-200" />
                    <span className="w-1 h-2 bg-teal-500 rounded-full animate-bounce delay-75" />
                  </div>
                )}
              </div>

              {/* Speech transcript speech bubble */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-h-[52px] flex items-center justify-center text-center">
                {transcript || interimTranscript ? (
                  <p className="text-xs sm:text-sm font-black text-indigo-950">
                    "{transcript || interimTranscript}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium italic">
                    {isListening
                      ? 'Bé hãy nói: "Sơ đồ lớp", "Phiếu bài tập" hoặc "Cửa hàng"...'
                      : 'Bấm nút mic tròn màu đỏ bên dưới để bắt đầu nói!'}
                  </p>
                )}
              </div>

              {/* Matched Command Success Banner */}
              {matchedCommand && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-2.5 flex items-center space-x-2 animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-left text-xs">
                    <p className="font-black text-emerald-900">
                      🎯 Đã chuyển sang: <strong>{matchedCommand.name}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700">{matchedCommand.responseMsg}</p>
                  </div>
                </div>
              )}

              {/* Error Message if any */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-300 rounded-2xl p-2.5 text-xs text-rose-800 text-left font-medium">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Supported Commands Cheat-sheet */}
            <div className="pt-2 border-t border-indigo-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Khẩu lệnh bé có thể nói (Chạm để thử):
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {VOICE_COMMANDS.map((cmd) => {
                  const IconComp = cmd.icon;
                  const isActive = activeTab === cmd.tabKey;
                  return (
                    <button
                      key={cmd.tabKey}
                      onClick={() => handleChipClick(cmd)}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                          : 'bg-white hover:bg-indigo-50/80 border-slate-200 text-slate-700 font-bold'
                      }`}
                    >
                      <IconComp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : 'text-indigo-600'
                        }`}
                      />
                      <span className="text-xs truncate">"{cmd.name}"</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls inside panel */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={toggleListening}
                className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-600/25'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Dừng Lắng Nghe</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Bật Lắng Nghe Giọng Nói</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Floating Quick Action Mic Button */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Collapsed Pill Indicator if Listening */}
          {isListening && !isExpanded && (
            <div
              onClick={() => setIsExpanded(true)}
              className="bg-rose-600 text-white px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-2 cursor-pointer animate-pulse border-2 border-white"
            >
              <Radio className="w-4 h-4 animate-spin text-amber-300" />
              <span className="text-xs font-black">
                {transcript ? `"${transcript}"` : 'Đang nghe...'}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              if (!isExpanded) {
                setIsExpanded(true);
                if (!isListening) toggleListening();
              } else {
                toggleListening();
              }
            }}
            title={isListening ? 'Đang lắng nghe bé nói (Bấm để dừng)' : 'Bấm để điều khiển bằng giọng nói'}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer border-3 border-white ${
              isListening
                ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white ring-4 ring-rose-400/40 animate-pulse scale-105'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white hover:scale-105 shadow-purple-500/30'
            }`}
          >
            {isListening ? <Mic className="w-7 h-7" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </>
  );
};
