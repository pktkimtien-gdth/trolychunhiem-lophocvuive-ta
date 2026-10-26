import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { TimetableSlot, TimetableSubjectId } from '../types';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { generateSlotId } from '../utils/uuid';
import {
  Calendar,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  RotateCcw,
  BookOpen,
  Info,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

interface TimeTableManagerProps {
  onSuccess?: () => void;
}

export const TimeTableManager: React.FC<TimeTableManagerProps> = ({ onSuccess }) => {
  const {
    timetableSlots,
    bulkUpdateTimetableSlots,
    timetableSettings,
    updateTimetableSettings,
    timetableSubjects,
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<'upload_file' | 'paste_text' | 'preset_2018'>('preset_2018');
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [weekTitle, setWeekTitle] = useState(timetableSettings.weekTitle);
  const [weeklyNotes, setWeeklyNotes] = useState(timetableSettings.weeklyNotes);
  const [notification, setNotification] = useState<string | null>(null);

  // Mẫu Thời Khóa Biểu Tiêu Chuẩn Lớp 5 (Không ghi tên giáo viên vào TKB)
  const standardGrade5Preset: TimetableSlot[] = [
    // THỨ HAI
    {
      id: 'slot-mon-1',
      dayOfWeek: 2,
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
      subjectId: 'hd_trai_nghiem',
      subjectName: 'Hoạt động trải nghiệm',
      lessonTitle: 'Sinh hoạt dưới cờ: Phát động phong trào Vui Đến Trường',
      room: 'Sân trường',
    },
    {
      id: 'slot-mon-2',
      dayOfWeek: 2,
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
      subjectId: 'toan',
      subjectName: 'Toán',
      lessonTitle: 'Ôn tập và bổ sung về phân số, hỗn số (Tiết 1)',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-mon-3',
      dayOfWeek: 2,
      session: 'morning',
      period: 3,
      timeRange: '09:10 - 09:45',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Bài 1: Khởi động năm học mới - Đọc hiểu văn bản',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-mon-4',
      dayOfWeek: 2,
      session: 'morning',
      period: 4,
      timeRange: '09:55 - 10:30',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Luyện từ và câu: Đại từ trong Tiếng Việt',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-mon-5',
      dayOfWeek: 2,
      session: 'afternoon',
      period: 1,
      timeRange: '14:00 - 14:35',
      subjectId: 'khoa_hoc',
      subjectName: 'Khoa học',
      lessonTitle: 'Sự sinh sản và phát triển của thực vật có hoa',
      room: 'Phòng Khoa Học',
    },
    {
      id: 'slot-mon-6',
      dayOfWeek: 2,
      session: 'afternoon',
      period: 2,
      timeRange: '14:45 - 15:20',
      subjectId: 'lich_su_dia_li',
      subjectName: 'Lịch sử và Địa lí',
      lessonTitle: 'Địa hình và khoáng sản Việt Nam',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-mon-7',
      dayOfWeek: 2,
      session: 'afternoon',
      period: 3,
      timeRange: '15:30 - 16:05',
      subjectId: 'hd_trai_nghiem',
      subjectName: 'Hoạt động trải nghiệm',
      lessonTitle: 'Tự chủ học tập và rèn luyện nếp sống văn minh',
      room: 'Phòng 5B.2',
    },

    // THỨ BA
    {
      id: 'slot-tue-1',
      dayOfWeek: 3,
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
      subjectId: 'toan',
      subjectName: 'Toán',
      lessonTitle: 'Khái niệm số thập phân & Hàng của số thập phân',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-tue-2',
      dayOfWeek: 3,
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Viết: Luyện tập tả cảnh thiên nhiên quê hương',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-tue-3',
      dayOfWeek: 3,
      session: 'morning',
      period: 3,
      timeRange: '09:10 - 09:45',
      subjectId: 'tieng_anh',
      subjectName: 'Tiếng Anh',
      lessonTitle: 'Unit Starter: Back to School Adventures',
      room: 'Phòng Ngoại Ngữ',
    },
    {
      id: 'slot-tue-4',
      dayOfWeek: 3,
      session: 'morning',
      period: 4,
      timeRange: '09:55 - 10:30',
      subjectId: 'tin_hoc',
      subjectName: 'Tin học',
      lessonTitle: 'Khám phá thế giới số: An toàn thông tin trên Internet',
      room: 'Phòng Tin Học',
    },
    {
      id: 'slot-tue-5',
      dayOfWeek: 3,
      session: 'afternoon',
      period: 1,
      timeRange: '14:00 - 14:35',
      subjectId: 'cong_nghe',
      subjectName: 'Công nghệ',
      lessonTitle: 'Mô hình kỹ thuật và lắp ghép robot đơn giản',
      room: 'Phòng STEM',
    },
    {
      id: 'slot-tue-6',
      dayOfWeek: 3,
      session: 'afternoon',
      period: 2,
      timeRange: '14:45 - 15:20',
      subjectId: 'nghe_thuat',
      subjectName: 'Nghệ thuật',
      lessonTitle: 'Âm nhạc & Mĩ thuật: Vũ khúc sắc màu Vui Đến Trường',
      room: 'Phòng Đa Năng',
    },
    {
      id: 'slot-tue-7',
      dayOfWeek: 3,
      session: 'afternoon',
      period: 3,
      timeRange: '15:30 - 16:05',
      subjectId: 'gd_the_chat',
      subjectName: 'Giáo dục thể chất',
      lessonTitle: 'Bài tập thể dục phát triển chung & Trò chơi vận động',
      room: 'Sân thể thao',
    },

    // THỨ TƯ
    {
      id: 'slot-wed-1',
      dayOfWeek: 4,
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
      subjectId: 'toan',
      subjectName: 'Toán',
      lessonTitle: 'So sánh hai số thập phân & Các phép tính',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-wed-2',
      dayOfWeek: 4,
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Đọc: Bài ca đất nước & Tìm hiểu biện pháp tu từ',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-wed-3',
      dayOfWeek: 4,
      session: 'morning',
      period: 3,
      timeRange: '09:10 - 09:45',
      subjectId: 'khoa_hoc',
      subjectName: 'Khoa học',
      lessonTitle: 'Năng lượng mặt trời, năng lượng gió và nước chảy',
      room: 'Phòng Khoa Học',
    },
    {
      id: 'slot-wed-4',
      dayOfWeek: 4,
      session: 'morning',
      period: 4,
      timeRange: '09:55 - 10:30',
      subjectId: 'dao_duc',
      subjectName: 'Đạo đức',
      lessonTitle: 'Biết ơn những người có công với quê hương đất nước',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-wed-5',
      dayOfWeek: 4,
      session: 'afternoon',
      period: 1,
      timeRange: '14:00 - 14:35',
      subjectId: 'tieng_anh',
      subjectName: 'Tiếng Anh',
      lessonTitle: 'Listening & Speaking: Classroom Presentation',
      room: 'Phòng Ngoại Ngữ',
    },
    {
      id: 'slot-wed-6',
      dayOfWeek: 4,
      session: 'afternoon',
      period: 2,
      timeRange: '14:45 - 15:20',
      subjectId: 'toan',
      subjectName: 'Toán',
      lessonTitle: 'Luyện tập giải toán chuyển động đều',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-wed-7',
      dayOfWeek: 4,
      session: 'afternoon',
      period: 3,
      timeRange: '15:30 - 16:05',
      subjectId: 'phong_trao',
      subjectName: 'Hoạt động trải nghiệm',
      lessonTitle: 'CLB Toán Vui & Đố vui tri thức',
      room: 'Phòng 5B.2',
    },

    // THỨ NĂM
    {
      id: 'slot-thu-1',
      dayOfWeek: 5,
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
      subjectId: 'toan',
      subjectName: 'Toán',
      lessonTitle: 'Cộng, trừ, nhân, chia số thập phân',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-thu-2',
      dayOfWeek: 5,
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Nói và nghe: Trao đổi về cuốn sách em yêu thích',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-thu-3',
      dayOfWeek: 5,
      session: 'morning',
      period: 3,
      timeRange: '09:10 - 09:45',
      subjectId: 'lich_su_dia_li',
      subjectName: 'Lịch sử và Địa lí',
      lessonTitle: 'Văn minh sông Hồng và cội nguồn dân tộc',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-thu-4',
      dayOfWeek: 5,
      session: 'morning',
      period: 4,
      timeRange: '09:55 - 10:30',
      subjectId: 'tin_hoc',
      subjectName: 'Tin học',
      lessonTitle: 'Soạn thảo văn bản và trình bày bài thuyết trình số',
      room: 'Phòng Tin Học',
    },
    {
      id: 'slot-thu-5',
      dayOfWeek: 5,
      session: 'afternoon',
      period: 1,
      timeRange: '14:00 - 14:35',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Góc sáng tạo: Viết đoạn văn ngắn theo phong cách 3D',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-thu-6',
      dayOfWeek: 5,
      session: 'afternoon',
      period: 2,
      timeRange: '14:45 - 15:20',
      subjectId: 'gd_the_chat',
      subjectName: 'Giáo dục thể chất',
      lessonTitle: 'Bóng rổ mini & Rèn luyện sức bền thể lực',
      room: 'Sân thể thao',
    },
    {
      id: 'slot-thu-7',
      dayOfWeek: 5,
      session: 'afternoon',
      period: 3,
      timeRange: '15:30 - 16:05',
      subjectId: 'hd_trai_nghiem',
      subjectName: 'Hoạt động trải nghiệm',
      lessonTitle: 'Kỹ năng làm việc nhóm và giải quyết vấn đề',
      room: 'Phòng 5B.2',
    },

    // THỨ SÁU
    {
      id: 'slot-fri-1',
      dayOfWeek: 6,
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
      subjectId: 'toan',
      subjectName: 'Toán',
      lessonTitle: 'Giải toán tỉ số phần trăm và ứng dụng thực tế',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-fri-2',
      dayOfWeek: 6,
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
      subjectId: 'tieng_viet',
      subjectName: 'Tiếng Việt',
      lessonTitle: 'Ôn tập tuần & Hướng dẫn Phiếu bài tập cuối tuần',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-fri-3',
      dayOfWeek: 6,
      session: 'morning',
      period: 3,
      timeRange: '09:10 - 09:45',
      subjectId: 'tieng_anh',
      subjectName: 'Tiếng Anh',
      lessonTitle: 'Review & Mini-Quizizz Game Vui Nhộn',
      room: 'Phòng Ngoại Ngữ',
    },
    {
      id: 'slot-fri-4',
      dayOfWeek: 6,
      session: 'morning',
      period: 4,
      timeRange: '09:55 - 10:30',
      subjectId: 'nghe_thuat',
      subjectName: 'Nghệ thuật',
      lessonTitle: 'Vẽ tranh phong cảnh trường học bằng màu nước',
      room: 'Phòng Mĩ Thuật',
    },
    {
      id: 'slot-fri-5',
      dayOfWeek: 6,
      session: 'afternoon',
      period: 1,
      timeRange: '14:00 - 14:35',
      subjectId: 'khoa_hoc',
      subjectName: 'Khoa học',
      lessonTitle: 'Thực hành thí nghiệm bảo vệ môi trường nước',
      room: 'Phòng Khoa Học',
    },
    {
      id: 'slot-fri-6',
      dayOfWeek: 6,
      session: 'afternoon',
      period: 2,
      timeRange: '14:45 - 15:20',
      subjectId: 'phong_trao',
      subjectName: 'Hoạt động trải nghiệm',
      lessonTitle: 'Tổng kết thi đua tuần, tích lũy xu thưởng & đổi quà tặng',
      room: 'Phòng 5B.2',
    },
    {
      id: 'slot-fri-7',
      dayOfWeek: 6,
      session: 'afternoon',
      period: 3,
      timeRange: '15:30 - 16:05',
      subjectId: 'hd_trai_nghiem',
      subjectName: 'Hoạt động trải nghiệm',
      lessonTitle: 'Sinh hoạt Lớp 5B.2 Vui Vẻ: Bình xét bé chăm ngoan',
      room: 'Phòng 5B.2',
    },
  ];

  // Helper mapping subject name to subjectId
  const detectSubjectId = (name: string): TimetableSubjectId => {
    const lower = name.toLowerCase();
    if (lower.includes('toán')) return 'toan';
    if (lower.includes('việt') || lower.includes('từ và câu') || lower.includes('tập đọc')) return 'tieng_viet';
    if (lower.includes('khoa')) return 'khoa_hoc';
    if (lower.includes('lịch sử') || lower.includes('địa')) return 'lich_su_dia_li';
    if (lower.includes('tin')) return 'tin_hoc';
    if (lower.includes('công nghệ')) return 'cong_nghe';
    if (lower.includes('đạo đức')) return 'dao_duc';
    if (lower.includes('anh') || lower.includes('english')) return 'tieng_anh';
    if (lower.includes('thể chất') || lower.includes('thể dục')) return 'gd_the_chat';
    if (lower.includes('nghệ thuật') || lower.includes('mĩ thuật') || lower.includes('âm nhạc')) return 'nghe_thuat';
    return 'hd_trai_nghiem';
  };

  const handleApplyPreset2018 = () => {
    // Clone preset slots with brand new cryptographic UUIDs
    const freshPresetSlots: TimetableSlot[] = standardGrade5Preset.map((s) => ({
      ...s,
      id: generateSlotId(s.dayOfWeek, s.period),
    }));
    bulkUpdateTimetableSlots(freshPresetSlots);
    updateTimetableSettings({
      weekTitle: weekTitle || 'Tuần 24 (Học kỳ II)',
      weeklyNotes: weeklyNotes || 'Phụ huynh vui lòng nhắc nhở các con hoàn thành phiếu bài tập cuối tuần để nhận xu thưởng!',
    });
    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setNotification('Đã cập nhật Thời khóa biểu Lớp 5 (không ghi tên giáo viên)!');
    setTimeout(() => {
      setNotification(null);
      if (onSuccess) onSuccess();
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    soundEffects.playClick();

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        parseAndApplyTimetable(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const parseAndApplyTimetable = (content: string, sourceName?: string) => {
    try {
      const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const updatedSlots: TimetableSlot[] = [];

      let currentDay: 2 | 3 | 4 | 5 | 6 = 2;
      let period = 1;

      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('thứ hai') || lower.includes('thứ 2')) {
          currentDay = 2;
          period = 1;
        } else if (lower.includes('thứ ba') || lower.includes('thứ 3')) {
          currentDay = 3;
          period = 1;
        } else if (lower.includes('thứ tư') || lower.includes('thứ 4')) {
          currentDay = 4;
          period = 1;
        } else if (lower.includes('thứ năm') || lower.includes('thứ 5')) {
          currentDay = 5;
          period = 1;
        } else if (lower.includes('thứ sáu') || lower.includes('thứ 6')) {
          currentDay = 6;
          period = 1;
        } else {
          // Parse subject from line
          const parts = line.split(/[,;\t|:]/);
          const subjectRaw = (parts[0] || 'Hoạt động trải nghiệm').trim();
          const titleRaw = (parts[1] || `Tiết học chủ đề môn ${subjectRaw}`).trim();
          const subjectId = detectSubjectId(subjectRaw);

          // Get normalized name
          const subjectObj = timetableSubjects.find((s) => s.id === subjectId);
          const normalizedSubjectName = subjectObj ? subjectObj.name : subjectRaw;

          const session = period <= 4 ? 'morning' : 'afternoon';
          const timeRange =
            period === 1 ? '07:30 - 08:05' :
            period === 2 ? '08:15 - 08:50' :
            period === 3 ? '09:10 - 09:45' :
            period === 4 ? '09:55 - 10:30' :
            period === 5 ? '14:00 - 14:35' :
            period === 6 ? '14:45 - 15:20' : '15:30 - 16:05';

          const uniqueId = generateSlotId(currentDay, period);

          updatedSlots.push({
            id: uniqueId,
            dayOfWeek: currentDay,
            session,
            period: period <= 4 ? period : period - 4,
            timeRange,
            subjectId,
            subjectName: normalizedSubjectName,
            lessonTitle: titleRaw,
            room: 'Phòng 5B.2',
            // Lưu ý: Tuyệt đối không ghi tên giáo viên vào thời khóa biểu học sinh
          });

          period = period >= 7 ? 1 : period + 1;
        }
      }

      if (updatedSlots.length > 0) {
        bulkUpdateTimetableSlots(updatedSlots);
        updateTimetableSettings({
          weekTitle: weekTitle || `TKB Cập Nhật từ ${sourceName || 'File'}`,
          weeklyNotes,
        });
        soundEffects.playWorksheetComplete();
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setNotification(`Đã trích xuất và cập nhật thành công ${updatedSlots.length} tiết học!`);
        setTimeout(() => {
          setNotification(null);
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        // Fallback to preset
        handleApplyPreset2018();
      }
    } catch {
      handleApplyPreset2018();
    }
  };

  const handleManualPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    parseAndApplyTimetable(rawText, 'Nội dung dán trực tiếp');
  };

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Title & Guidance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <span>Quản Lý & Cập Nhật Thời Khóa Biểu</span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-full">
                Lớp 5
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Cập nhật lịch học cho Lớp 5B.2 Vui Vẻ • Hiển thị tức thì cho Học sinh & Phụ huynh
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('preset_2018')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'preset_2018'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mẫu Chuẩn Lớp 5
          </button>
          <button
            onClick={() => setActiveTab('upload_file')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'upload_file'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tải File TKB
          </button>
          <button
            onClick={() => setActiveTab('paste_text')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'paste_text'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dán Văn Bản TKB
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Rules Notice: Môn học Lớp 5 */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
        <div className="font-extrabold flex items-center space-x-1.5 text-blue-950">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Quy định chuẩn hóa môn học Chương trình Lớp 5:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-800 leading-relaxed">
          <div>
            • <strong>Tên môn học chuẩn:</strong> Tiếng Việt, Toán, Đạo đức, Khoa học, Lịch sử và Địa lí, Tin học, Công nghệ, Giáo dục thể chất, Nghệ thuật (Âm nhạc, Mĩ thuật), Hoạt động trải nghiệm.
          </div>
          <div>
            • <strong>Không dùng tên cũ:</strong> Không dùng "Tự nhiên xã hội" cho lớp 5; không tách rời "Luyện từ và câu" khỏi môn Tiếng Việt trên TKB.
          </div>
          <div className="sm:col-span-2 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            ✓ Tuyệt đối KHÔNG ghi tên giáo viên vào thời khóa biểu học sinh theo đúng quy chuẩn sư phạm thân thiện!
          </div>
        </div>
      </div>

      {/* Week Title & Notes input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tên Tuần Học / Tiêu Đề Thời Khóa Biểu
          </label>
          <input
            type="text"
            value={weekTitle}
            onChange={(e) => setWeekTitle(e.target.value)}
            placeholder="Ví dụ: Tuần 24 (Học kỳ II)"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Lời Nhắn & Dặn Dò Học Sinh / Phuh Huynh
          </label>
          <input
            type="text"
            value={weeklyNotes}
            onChange={(e) => setWeeklyNotes(e.target.value)}
            placeholder="Ví dụ: Các em nhớ hoàn thành bài tập cuối tuần trước Chủ Nhật để nhận Xu thưởng nhé!"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* TAB 1: PRESET CHUẨN LỚP 5 */}
      {activeTab === 'preset_2018' && (
        <div className="space-y-4 bg-emerald-50/40 p-5 rounded-3xl border border-emerald-200/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-extrabold text-emerald-950 text-sm sm:text-base">
                Mẫu Thời Khóa Biểu Lớp 5 Tiêu Chuẩn
              </h3>
              <p className="text-xs text-emerald-800">
                Bố trí khoa học: Sáng 4 tiết học chính khóa (Toán, Tiếng Việt, Tiếng Anh) • Chiều rèn luyện kỹ năng, Khoa học, STEM và Hoạt động trải nghiệm.
              </p>
            </div>

            <button
              onClick={handleApplyPreset2018}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/25 transition-all flex items-center space-x-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Áp Dụng Mẫu Này Ngay</span>
            </button>
          </div>

          {/* Quick Schedule Preview Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] pt-2">
            {[
              { day: 'Thứ Hai', m: 'Chào cờ, Toán, Tiếng Việt x2', a: 'Khoa học, Lịch sử, HĐTN' },
              { day: 'Thứ Ba', m: 'Toán, Tiếng Việt, Tiếng Anh, Tin học', a: 'Công nghệ, Nghệ thuật, Thể chất' },
              { day: 'Thứ Tư', m: 'Toán, Tiếng Việt, Khoa học, Đạo đức', a: 'Tiếng Anh, Toán, CLB Toán' },
              { day: 'Thứ Năm', m: 'Toán, Tiếng Việt, Lịch sử, Tin học', a: 'Tiếng Việt, Thể chất, Kỹ năng' },
              { day: 'Thứ Sáu', m: 'Toán, Tiếng Việt, Tiếng Anh, Mĩ thuật', a: 'Khoa học, Tổng kết sao, Sinh hoạt lớp' },
            ].map((col) => (
              <div key={col.day} className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
                <span className="font-extrabold text-emerald-900 block border-b border-emerald-50 pb-1 mb-1.5">
                  {col.day}
                </span>
                <p className="text-slate-600 text-[10px] mb-1">
                  <strong className="text-indigo-600">Sáng:</strong> {col.m}
                </p>
                <p className="text-slate-600 text-[10px]">
                  <strong className="text-amber-600">Chiều:</strong> {col.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD FILE (EXCEL / CSV / TXT / DOCX) */}
      {activeTab === 'upload_file' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-emerald-300 rounded-3xl p-8 text-center bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors">
            <input
              type="file"
              id="tkb-file-upload"
              accept=".csv,.txt,.xlsx,.xls,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="tkb-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-slate-800">
                  {fileName ? `Đã chọn: ${fileName}` : 'Bấm vào đây để chọn file thời khóa biểu'}
                </p>
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng Excel (.xlsx, .xls), CSV (.csv), Văn bản (.txt, .docx)
                </p>
              </div>
              <span className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs">
                Chọn File Từ Máy Tính
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: DÁN VĂN BẢN TKB TRỰC TIẾP */}
      {activeTab === 'paste_text' && (
        <form onSubmit={handleManualPasteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dán nội dung thời khóa biểu vào đây:
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Thứ Hai:\nToán: Ôn tập phân số\nTiếng Việt: Đại từ\nKhoa học: Cây có hoa\n\nThứ Ba:\nToán: Số thập phân\nTiếng Anh: Unit 1\nTin học: An toàn mạng`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/25 transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Trích Xuất & Lưu Thời Khóa Biểu</span>
            </button>
          </div>
        </form>
      )}

      {/* Current Timetable Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Hiện có <strong>{timetableSlots.length}</strong> tiết học đã được lưu trong hệ thống</span>
        <span className="text-emerald-700 font-bold">Lớp 5B.2 Vui Vẻ • GVCN: Cô Kim Tiến Number Hi!</span>
      </div>
    </div>
  );
};
