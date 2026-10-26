import React, { useState, useMemo } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { WeeklyTimetable } from './WeeklyTimetable';
import { HighlightedEventAnnouncements } from './common/HighlightedEventAnnouncements';
import {
  Heart,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Gift,
  Coins,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Calendar,
  Users,
  ArrowRightLeft,
  X,
  LogOut
} from 'lucide-react';

export const ParentPortalView: React.FC = () => {
  const {
    students,
    activeParentStudentId,
    setActiveParentStudentId,
    submissions,
    redemptions,
    logout
  } = useClassroom();
  const [showTimetableSection, setShowTimetableSection] = useState(true);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const currentStudent = students.find((s) => s.id === activeParentStudentId) || students[0];

  // Chỉ lấy các học sinh được liên kết hợp lệ với tài khoản phụ huynh đang đăng nhập
  // Nếu có nhiều con (cùng parentPin bảo mật), cho phép chuyển đổi giữa các con; nếu chỉ có 1 con thì ẩn nút chuyển đổi
  const linkedStudents = useMemo(() => {
    if (!currentStudent) return [];
    if (currentStudent.parentPin && currentStudent.parentPin.trim().length > 0) {
      const pinMatches = students.filter(
        (s) => s.parentPin && s.parentPin.trim() === currentStudent.parentPin?.trim()
      );
      if (pinMatches.length > 0) return pinMatches;
    }
    return [currentStudent];
  }, [students, currentStudent]);

  const studentSubmissions = submissions.filter((s) => s.studentId === currentStudent?.id);
  const studentRedemptions = redemptions.filter((r) => r.studentId === currentStudent?.id);

  const averageScore = studentSubmissions.length
    ? Math.round(studentSubmissions.reduce((acc, s) => acc + s.percent, 0) / studentSubmissions.length)
    : 92;

  if (!currentStudent) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner: Respectful & Warm Parent Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1 border-4 border-emerald-300 shadow-xl overflow-hidden shrink-0">
            <img
              src={currentStudent.avatar}
              alt={currentStudent.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap gap-y-1">
              <span className="bg-white/20 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Cổng Thông Tin Phụ Huynh
              </span>
              <span className="text-emerald-100 text-xs font-bold">
                Lớp 5B.2 Vui Vẻ • Năm học 2026 - 2027 • GVCN: Cô Kim Tiến
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mt-1.5 truncate">
              Phụ huynh của học sinh: {currentStudent.name}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
              Hệ thống theo dõi tiến độ học tập, nề nếp tự học và bảng điểm số hóa.
            </p>

            <div className="flex items-center justify-center sm:justify-start space-x-3 mt-4 text-xs font-black flex-wrap gap-y-1">
              <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-full shadow-xs">
                🪙 {currentStudent.coins} Xu Thưởng
              </span>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full">
                ⭐ {currentStudent.stars} Ngôi Sao
              </span>
              <span className="bg-emerald-900/60 text-emerald-100 px-3 py-1 rounded-full border border-emerald-300/40 font-black">
                {currentStudent.group ? `Phân tổ: ${currentStudent.group}` : 'Chưa phân tổ'}
              </span>
              <span className="bg-emerald-800/40 text-emerald-100 px-3 py-1 rounded-full border border-emerald-300/30">
                Mã số: {currentStudent.studentCode || `HS5B2-${currentStudent.id}`}
              </span>
            </div>
          </div>

          {/* Quick Actions for Parents */}
          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 pt-2 sm:pt-0">
            {linkedStudents.length > 1 && (
              <button
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs shadow-md transition-all cursor-pointer"
                title="Chuyển sang xem hồ sơ con khác đã liên kết"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-700" />
                <span>Chuyển hồ sơ con ({linkedStudents.length})</span>
              </button>
            )}

            <button
              onClick={() => logout()}
              className="flex items-center space-x-1 px-3 py-2 rounded-2xl bg-emerald-800/50 hover:bg-emerald-800/80 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              title="Đăng xuất khỏi tài khoản phụ huynh"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thông Báo Sự Kiện Nổi Bật Dành Cho Phụ Huynh */}
      <HighlightedEventAnnouncements audience="parents" />

      {/* Metrics Row: Bài tập, Điểm trung bình, Quà đã đổi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bài tập đã hoàn thành
            </span>
            <div className="text-xl font-black text-slate-800">
              {studentSubmissions.length} phiếu bài
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Điểm số rèn luyện trung bình
            </span>
            <div className="text-xl font-black text-indigo-600">
              {averageScore}% ({averageScore >= 80 ? 'Đạt chuẩn xuất sắc' : 'Đang tiến bộ'})
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Phần quà học sinh đã đổi thưởng
            </span>
            <div className="text-xl font-black text-pink-600">
              {studentRedemptions.length} phần quà
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Evaluation & Notes */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-indigo-700 font-extrabold text-sm">
          <MessageSquare className="w-4 h-4" />
          <span>Nhận Xét Của Giáo Viên Chủ Nhiệm (Cô Kim Tiến)</span>
        </div>
        <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 text-sm font-semibold text-slate-800 leading-relaxed">
          "{currentStudent.teacherComments || currentStudent.notes || 'Học sinh rất ngoan, tự giác hoàn thành bài tập đúng hạn, tích cực phát biểu và có ý thức rèn luyện tốt.'}"
        </div>
      </div>

      {/* THỜI KHÓA BIỂU & KẾ HOẠCH HỌC TẬP TUẦN NÀY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <h3 className="font-black text-lg text-slate-800">
              Kế Hoạch & Thời Khóa Biểu Học Tập Trong Tuần (Lớp 5B.2)
            </h3>
          </div>
          <button
            onClick={() => setShowTimetableSection(!showTimetableSection)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
          >
            {showTimetableSection ? 'Thu gọn lịch' : 'Mở lịch tuần'}
          </button>
        </div>

        {showTimetableSection && (
          <WeeklyTimetable embeddedInParent={true} />
        )}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-black text-base text-slate-800">
          Kết Quả Các Bài Tập Gần Đây Của Học Sinh
        </h3>

        <div className="space-y-3">
          {studentSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div>
                <h4 className="font-bold text-slate-900">{sub.worksheetTitle}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {sub.subject} • Nộp lúc: {sub.timestamp}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-black text-indigo-600">
                  {sub.score}/{sub.totalQuestions} ({sub.percent}%)
                </span>
                {sub.isPassed ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2 py-0.5 rounded-md">
                    ≥80% (+{sub.coinsEarned} Xu)
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-md">
                    Cố gắng
                  </span>
                )}
              </div>
            </div>
          ))}

          {studentSubmissions.length === 0 && (
            <p className="text-xs text-slate-400 py-4 text-center">
              Học sinh chưa nộp bài tập nào trong tuần này.
            </p>
          )}
        </div>
      </div>

      {/* Switch Student Modal for Parents */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 relative">
            <button
              onClick={() => setShowSwitchModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Chọn học sinh cần xem
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Quý phụ huynh muốn chuyển sang xem hồ sơ của học sinh nào?
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {linkedStudents.map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    setActiveParentStudentId(st.id);
                    setShowSwitchModal(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    currentStudent.id === st.id
                      ? 'bg-emerald-600 text-white font-black border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 font-bold border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-8 h-8 rounded-full bg-white border object-cover shrink-0"
                    />
                    <span className="text-xs font-bold">{st.name}</span>
                  </div>
                  {currentStudent.id === st.id && (
                    <span className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded-full font-black">
                      Đang xem
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Quay lại hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
