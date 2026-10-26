export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface Student {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  avatar: string;
  coins: number;
  stars: number;
  deskId?: string;
  row?: number;
  col?: number;
  attendanceStatus?: 'present' | 'absent' | 'late';
  badges: string[];
  notes?: string;
  parentPin?: string;
  // Các trường quản trị học sinh Lớp 5B.2
  studentCode?: string; // e.g. "HS5B2-01"
  group?: string; // "Tổ 1" | "Tổ 2" | "Tổ 3" | "Tổ 4"
  goals?: string; // Mục tiêu học tập và sự tiến bộ
  teacherComments?: string; // Nhận xét của cô Kim Tiến
  academicScores?: Record<string, number>; // Điểm đánh giá các môn
  reminderNotes?: string[]; // Lịch sử nhắc nhở
}

export type TaskStudentStatus =
  | 'not_started' // Chưa thực hiện
  | 'in_progress' // Đang thực hiện
  | 'submitted' // Đã nộp, chờ giáo viên kiểm tra
  | 'completed' // Đã hoàn thành
  | 'needs_revision' // Cần chỉnh sửa
  | 'late'; // Nộp trễ

export interface SchoolSupplyItem {
  id: string;
  name: string;
  icon: string;
  coinCost: number;
  description: string;
  category: 'dung_cu' | 'huy_hieu' | 'dac_quyen';
  meaning: string;
}

export type AssignmentType =
  | 'interactive_quiz' // Trắc nghiệm / Điền khuyết / Đúng sai
  | 'external_link' // Bài tập / Học liệu liên kết ngoài (Olm, Khan Academy, VioEdu, YouTube...)
  | 'short_essay' // Tự luận ngắn / Cảm nghĩ / Lập dàn ý
  | 'practice_step'; // Bài luyện tập theo từng bước

export interface InteractiveTaskQuestion {
  id: string;
  type: 'single_choice' | 'fill_in' | 'true_false' | 'short_essay';
  prompt: string;
  options?: string[];
  correctAnswer?: any;
  hint?: string;
  explanation?: string;
}

export interface StudentTaskRecord {
  status: TaskStudentStatus;
  score?: number;
  note?: string;
  submittedAt?: string;
  updatedAt?: string;
  answers?: Record<string, any>; // Lưu đáp án học sinh làm
  attemptsCount?: number; // Số lần học sinh kiên trì làm lại bài
  selfDeclaredCompleted?: boolean; // Học sinh tự đánh dấu hoàn thành học liệu ngoài
  selfDeclaredNote?: string; // Ghi chú cảm nghĩ khi tự hoàn thành
  teacherVerified?: boolean; // Cô giáo xác nhận kết quả
}

export interface ClassTask {
  id: string;
  title: string;
  subject: string; // Môn học: Tiếng Việt, Toán, Khoa học, Lịch sử và Địa lí, Tin học, Công nghệ, Đạo đức, v.v.
  description: string;
  assignedDate: string;
  dueDate: string;
  assignedToType: 'all' | 'group' | 'custom';
  assignedGroup?: string; // 'Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4'
  assignedStudentIds?: string[];
  priority: 'low' | 'medium' | 'high';
  criteria?: string;
  rewardCoins: number;
  studentRecords: Record<string, StudentTaskRecord>;
  createdAt: string;
  week?: string; // e.g. "Tuần 24", "Tuần 23"
  attachmentUrl?: string;
  attachmentName?: string;
  isDraft?: boolean;
  isClosed?: boolean;
  taskType?: AssignmentType;
  questions?: InteractiveTaskQuestion[];
  externalUrl?: string;
  externalPlatform?: string;
}

export interface RewardHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  amount: number; // Điểm thưởng (+ hoặc - nếu thu hồi nhập nhầm)
  reason: string; // Lý do khen thưởng hoặc thu hồi
  badge?: string; // Ngôi sao chăm chỉ, Bước tiến nổi bật, Người bạn hợp tác, v.v.
  createdAt: string;
  recordedBy: string;
}

export interface SeatingPlan {
  id: string;
  name: string; // e.g. "Phương án 1: Đầu năm học (4 Dãy - 24 Bàn Đôi)"
  description?: string;
  desks: DeskPosition[];
  rowsCount: number;
  colsCount: number;
  seatsPerDesk: number;
  createdAt: string;
  isCurrent: boolean;
}

export interface StudentReminder {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  taskId: string;
  taskTitle: string;
  dueDate: string;
  status: TaskStudentStatus;
  message: string;
  copied: boolean;
}

export interface DeskPosition {
  id: string;
  row: number; // 1 to 6 (Hàng 1 đến Hàng 6)
  col: number; // 1 to 4 (Dãy 1 đến Dãy 4)
  tableNumber?: number; // Bàn 1 đến Bàn 24
  seat?: 1 | 2; // Chỗ 1 (trái) hoặc Chỗ 2 (phải) trong cùng 1 bàn
  label: string;
  studentId?: string;
}

export type SubjectCategory = 'Toán' | 'Tiếng Việt' | 'Tiếng Anh' | 'Tự nhiên & Xã hội' | 'Kỹ năng sống & Môi trường' | 'Bài tập cuối tuần';

export interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  image?: string;
}

export interface Worksheet {
  id: string;
  title: string;
  subject: SubjectCategory;
  grade: string;
  type: 'direct' | 'external_link';
  externalUrl?: string;
  provider?: 'quizizz' | 'wordwall' | 'forms' | 'liveworksheets' | 'other';
  description: string;
  questions?: Question[];
  rewardCoins: number;
  minPassPercent: number; // default 80%
  createdAt: string;
  sourceFileName?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  worksheetId: string;
  worksheetTitle: string;
  subject: SubjectCategory;
  score: number;
  totalQuestions: number;
  percent: number;
  isPassed: boolean; // >= 80%
  coinsEarned: number;
  timestamp: string;
  answers: Record<string, number>;
}

export interface GiftItem {
  id: string;
  name: string;
  category: 'dung_cu' | 'dac_quyen' | 'huy_hieu' | 'do_choi';
  coinsRequired: number;
  icon: string;
  imageColor: string;
  stock: number;
  description: string;
}

export interface RedemptionRecord {
  id: string;
  studentId: string;
  studentName: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  coinsSpent: number;
  timestamp: string;
  status: 'pending' | 'delivered';
}

export interface CallHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  timestamp: string;
  mode: 'pendulum' | 'wheel';
  awardedXu?: number;
}

export interface CameraChallenge {
  id: string;
  subject: SubjectCategory;
  question: string;
  challengeType: 'finger_choice' | 'body_tilt' | 'raise_hand' | 'show_item';
  options: string[];
  correctIndex: number;
  expectedActionDesc: string;
  explanation: string;
  rewardCoins: number;
}

export type TimetableSubjectId =
  | 'toan'
  | 'tieng_viet'
  | 'khoa_hoc'
  | 'cong_nghe'
  | 'hd_trai_nghiem'
  | 'lich_su_dia_li'
  | 'dao_duc'
  | 'tieng_anh'
  | 'tin_hoc'
  | 'nghe_thuat'
  | 'gd_the_chat'
  | 'phong_trao';

export interface TimetableSubjectConfig {
  id: TimetableSubjectId;
  name: string;
  shortName: string;
  isCore: boolean; // true: 5 môn chủ yếu (Toán, Tiếng Việt, Tiếng Anh, Khoa học, Lịch sử - Địa lí)
  icon: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  defaultTeacher: string;
  room: string;
  description: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 2 | 3 | 4 | 5 | 6; // 2: Thứ Hai, 3: Thứ Ba, 4: Thứ Tư, 5: Thứ Năm, 6: Thứ Sáu
  session: 'morning' | 'afternoon';
  period: number; // 1 to 4 in morning, 1 to 3 in afternoon
  timeRange: string;
  subjectId: TimetableSubjectId;
  subjectName: string;
  lessonTitle?: string;
  note?: string;
  teacher?: string;
  room?: string;
}

export interface TimetableAdminSettings {
  visibleSubjectIds: TimetableSubjectId[]; // Active displayed subjects
  showOnlyCore: boolean; // Default true: prioritize 5 main subjects
  weekTitle: string; // e.g. "Tuần 24 (Học kỳ II)"
  classTitle: string; // "Lớp 5B.2 Vui Vẻ"
  homeroomTeacher: string; // "Cô Kim Tiến Number Hi!"
  weeklyNotes: string;
}

export interface AIVideoItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  description: string;
  originalUrl: string; // YouTube, Google Drive, or file URL
  embedUrl: string; // Sanitized iframe embed URL
  thumbnailUrl: string;
  sourceType: 'google_drive' | 'youtube' | 'uploaded' | 'custom';
  createdAt: string;
  pixarPrompt?: string; // Prompt 3D Pixar/Disney style for Canva
  companionQuizId?: string; // Linked worksheet ID if any
  viewsCount?: number;
  likesCount?: number;
}

export interface MediaUploadItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: string;
}

export type BookCategory =
  | 'van_hoc'
  | 'khoa_hoc'
  | 'lich_su'
  | 'ky_nang'
  | 'truyen_tranh'
  | 'sgk_tai_lieu';

export interface BookItem {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  categoryLabel: string;
  coverUrl: string;
  pagesCount: number;
  readTimeEstimate: string; // e.g. "15 phút"
  rating: number; // e.g. 4.9
  summary: string;
  contentSample?: string[]; // Chapters or reading excerpts
  pdfUrl?: string; // Google Drive or PDF link
  moralLesson?: string; // Bài học rút ra
  rewardCoins: number; // Coins earned when finished reading
  tags: string[];
  isFeatured?: boolean;
}

export interface NavMenuItemConfig {
  id: string;
  label: string;
  icon: string; // Lucide icon name string e.g. "LayoutGrid" | "BookOpen"
  tabKey: string;
  visible: boolean;
  order: number;
  isSystem: boolean; // Cannot be deleted if true
  badge?: string;
  customUrl?: string; // If external link
}

export interface WebsiteThemeConfig {
  id: string;
  name: string;
  primaryColor: string; // e.g. '#2563eb'
  secondaryColor: string; // e.g. '#f59e0b'
  accentColor: string; // e.g. '#10b981'
  backgroundColor: string; // e.g. '#f8fafc'
  surfaceColor: string; // e.g. '#ffffff'
  textColor: string; // e.g. '#0f172a'
  cardRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontSizeScale: 'compact' | 'normal' | 'large';
  bannerStyle: 'gradient' | 'warm' | 'pastel' | 'playful';
}

export interface WebsiteContentConfig {
  brandName: string;
  className: string;
  schoolName: string;
  teacherName: string;
  schoolYear?: string;
  slogans: string[];
  subSlogan: string;
  welcomeMessage: string;
  announcementBanner?: string;
  showAnnouncementBanner: boolean;
  showSloganBanner: boolean;
  showWeeklyProgress: boolean;
  defaultLandingTab: string;
}

export interface ClassEventAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string; // e.g. "2026-10-28"
  time?: string; // e.g. "08:00"
  type: 'trip' | 'exam' | 'reminder' | 'meeting' | 'general';
  priority: 'urgent' | 'important' | 'normal';
  targetAudience?: 'all' | 'students' | 'parents';
  location?: string;
  author: string;
  isPinned: boolean;
  createdAt: string;
}

export interface WebsiteUIConfig {
  version: number;
  updatedAt: string;
  updatedBy: string;
  content: WebsiteContentConfig;
  theme: WebsiteThemeConfig;
  navMenu: NavMenuItemConfig[];
}
