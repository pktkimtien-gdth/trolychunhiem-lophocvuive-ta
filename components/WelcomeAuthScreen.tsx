import React, { useState, useMemo } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { useUIConfig } from '../context/UIConfigContext';
import {
  GraduationCap,
  ShieldCheck,
  Users,
  Sparkles,
  Lock,
  ArrowRight,
  Search,
  CheckCircle2,
  KeyRound,
  X,
  AlertCircle,
  Compass,
  Star,
  Award
} from 'lucide-react';
import { Student } from '../types';
import { AdminGoogleLoginButton } from './admin/AdminGoogleLoginButton';

export const WelcomeAuthScreen: React.FC = () => {
  const { students, loginAsTeacherOrAdmin, loginAsStudent, loginAsParent } = useClassroom();
  const { content } = useUIConfig();

  // Active sub-modal or flow: null | 'teacher' | 'student' | 'parent'
  const [activeFlow, setActiveFlow] = useState<'teacher' | 'student' | 'parent' | null>(null);

  // Teacher PIN state
  const [teacherPin, setTeacherPin] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [isVerifyingTeacher, setIsVerifyingTeacher] = useState(false);

  // Student search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Parent state
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [selectedStudentForParent, setSelectedStudentForParent] = useState<Student | null>(null);
  const [parentPin, setParentPin] = useState('');
  const [parentError, setParentError] = useState('');

  // Filter students for Student Picker
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [students, searchQuery]);

  // Filter students for Parent Picker
  const filteredParentStudents = useMemo(() => {
    return students.filter((s) =>
      s.name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(parentSearchQuery.toLowerCase()))
    );
  }, [students, parentSearchQuery]);

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    setIsVerifyingTeacher(true);
    const result = await loginAsTeacherOrAdmin(teacherPin);
    setIsVerifyingTeacher(false);
    if (!result.success) {
      setTeacherError(result.message);
    }
  };

  const handleSelectStudent = (student: Student) => {
    loginAsStudent(student);
  };

  const handleQuickExplore = () => {
    if (students.length > 0) {
      loginAsStudent(students[0]);
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForParent) {
      setParentError('Vui lòng chọn học sinh cần xem hồ sơ.');
      return;
    }
    setParentError('');
    const res = await loginAsParent(selectedStudentForParent, parentPin);
    if (!res.success) {
      setParentError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100/80 via-purple-50 to-pink-100/70 flex flex-col justify-center items-center px-4 py-8 relative font-['Quicksand',sans-serif] overflow-x-hidden">
      {/* Decorative vibrant background circles */}
      <div className="absolute top-8 left-8 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-8 w-96 h-96 bg-pink-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10 space-y-7">
        {/* Welcome Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white px-4 py-1.5 rounded-full shadow-md shadow-orange-500/20 border border-white/40 mb-1">
            <span className="text-lg">🏫</span>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950">
              {content.className || 'Lớp 5B.2 Vui Vẻ'} • {content.teacherName || 'GVCN: Cô Kim Tiến'}
            </span>
            <Star className="w-3.5 h-3.5 text-amber-950 fill-amber-950" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Chào mừng đến với{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
              {content.brandName || 'Vui Đến Trường'}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto font-bold">
            {content.slogans?.[0] || 'Mỗi ngày đến lớp – Mỗi ngày một niềm vui! Vui học sáng tạo, chăm ngoan rèn tài.'}
          </p>

          <p className="text-xs sm:text-sm text-indigo-700 font-extrabold bg-white/70 backdrop-blur-xs py-1 px-3 rounded-full inline-block border border-indigo-100 shadow-2xs">
            ✨ Vui lòng chọn đối tượng đăng nhập để bắt đầu trải nghiệm:
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Giáo viên / Quản trị viên */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border-2 border-purple-200 hover:border-purple-400 shadow-lg shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-lg font-black text-slate-900">Giáo Viên / Admin</h3>
                  <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Quản trị
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Dành cho Cô Kim Tiến (GVCN) và Quản trị viên để quản lý lớp học, phân quyền, giao bài, chấm điểm và tùy biến giao diện website.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setTeacherError('');
                  setTeacherPin('');
                  setActiveFlow('teacher');
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đăng nhập Quản trị</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Học sinh */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border-2 border-amber-300 hover:border-amber-500 shadow-lg shadow-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-end justify-start p-2 text-xs font-black text-amber-900 shadow-xs">
              42 HS
            </div>

            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-lg font-black text-slate-900">Học Sinh 5B.2</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Khám phá
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Dành cho 42 bạn nhỏ Lớp 5B.2 vào làm phiếu bài tập, thử thách tương tác, tích lũy xu thưởng, đổi quà và đọc sách số 3D.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGroup('all');
                  setActiveFlow('student');
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Em vào lớp học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Phụ huynh */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border-2 border-emerald-200 hover:border-emerald-400 shadow-lg shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-lg font-black text-slate-900">Phụ Huynh Học Sinh</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Đồng hành
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Dành cho cha mẹ theo dõi kết quả học tập, thời khóa biểu, tiến độ làm bài và những lời nhận xét từ giáo viên chủ nhiệm.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setParentSearchQuery('');
                  setSelectedStudentForParent(null);
                  setParentPin('');
                  setParentError('');
                  setActiveFlow('parent');
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Cổng Phụ Huynh</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Explore Button */}
        <div className="text-center pt-2">
          <button
            onClick={handleQuickExplore}
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-indigo-700 hover:text-indigo-900 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl border-2 border-indigo-200 shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>🌟 Khám Phá Nhanh Lớp Học 5B.2 (Xem Sơ Đồ 42 Bàn & Tiện Ích)</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>

        {/* Security & System Info Footer */}
        <div className="text-center text-xs text-slate-500 font-semibold space-y-1">
          <p>
            🛡️ Hệ thống xác thực bảo mật an toàn • Mã hóa mật khẩu • Bảo vệ dữ liệu học sinh
          </p>
          <p className="text-[11px] text-slate-400">
            Trường Tiểu Học • Lớp 5B.2 Vui Vẻ • Năm học 2026 - 2027
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: TEACHER / ADMIN PIN AUTHENTICATION */}
      {/* ======================================================== */}
      {activeFlow === 'teacher' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-100 relative">
            <button
              onClick={() => setActiveFlow(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Xác thực Quản trị viên</h3>
              <p className="text-xs text-slate-500 font-medium">
                Nhập mã PIN bảo mật của Quản trị viên
              </p>
            </div>

            {/* Đăng nhập bằng Google dành riêng cho Quản trị viên (Cô Kim Tiến) */}
            <div className="space-y-3 mb-5">
              <AdminGoogleLoginButton onSuccess={() => setActiveFlow(null)} />

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Hoặc đăng nhập bằng mã PIN
                </span>
              </div>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã PIN Quản trị viên (6 số)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={12}
                    value={teacherPin}
                    onChange={(e) => setTeacherPin(e.target.value)}
                    placeholder="Nhập mã PIN..."
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-purple-600 focus:bg-white focus:outline-hidden transition-all"
                  />
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {teacherError && (
                <div className="flex items-center space-x-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{teacherError}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFlow(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs sm:text-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingTeacher || !teacherPin}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isVerifyingTeacher ? 'Đang kiểm tra...' : 'Xác thực & Vào'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: STUDENT PICKER (42 STUDENTS OF CLASS 5B.2) */}
      {/* ======================================================== */}
      {activeFlow === 'student' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-amber-100 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveFlow(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-4 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shadow-inner">
                🎒
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Em là học sinh nào của Lớp 5B.2?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Chọn tên của em để nhận xu và tham gia các hoạt động thú vị!
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Gõ tên em để tìm nhanh..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Students Grid List */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer transition-all duration-200 group active:scale-[0.98]"
                  >
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-11 h-11 rounded-full border-2 border-amber-300 bg-white object-cover shadow-xs group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 truncate block">
                        {st.name}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors shrink-0" />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-bold">Không tìm thấy học sinh phù hợp.</p>
                  <p className="text-xs">Vui lòng kiểm tra lại từ khóa tìm kiếm.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PARENT PORTAL AUTHENTICATION */}
      {/* ======================================================== */}
      {activeFlow === 'parent' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-['Quicksand',sans-serif]">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-emerald-300 overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-5 text-white relative shrink-0">
              <button
                onClick={() => setActiveFlow(null)}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl shadow-inner border border-white/20">
                  👨‍👩‍👧
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Cổng Kết Nối Phụ Huynh</h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Xem quá trình học tập, bảng điểm và rèn luyện của học sinh Lớp 5B.2
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleParentSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Select Student */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Chọn học sinh cần xem trong Lớp 5B.2:
                  </label>
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={parentSearchQuery}
                      onChange={(e) => setParentSearchQuery(e.target.value)}
                      placeholder="Gõ tên học sinh để tìm nhanh..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/60">
                    {filteredParentStudents.map((st) => {
                      const isSelected = selectedStudentForParent?.id === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            setSelectedStudentForParent(st);
                            setParentError('');
                          }}
                          onDoubleClick={() => {
                            setSelectedStudentForParent(st);
                            loginAsParent(st, parentPin);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-black shadow-md'
                              : 'bg-white hover:bg-emerald-50 text-slate-800 font-bold border border-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-8 h-8 rounded-full bg-white border shrink-0 object-cover"
                            />
                            <span className="text-xs sm:text-sm truncate">{st.name}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {isSelected ? (
                              <span className="flex items-center space-x-1 bg-white text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã chọn</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-100 group-hover:bg-emerald-100 px-2 py-0.5 rounded-md">
                                Chạm để chọn
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Parent PIN */}
                {selectedStudentForParent?.parentPin && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Mã PIN bảo mật phụ huynh (nếu có):
                      </label>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-black">
                        Gợi ý: {selectedStudentForParent.parentPin}
                      </span>
                    </div>
                    <input
                      type="password"
                      maxLength={10}
                      value={parentPin}
                      onChange={(e) => {
                        setParentPin(e.target.value);
                        setParentError('');
                      }}
                      placeholder={`Nhập mã (hoặc để trống/nhập ${selectedStudentForParent.parentPin})...`}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Error Banner */}
                {parentError && (
                  <div className="flex items-center space-x-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parentError}</span>
                  </div>
                )}
              </div>

              {/* Sticky Always-Visible Bottom Action Bar */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveFlow(null)}
                  className="py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  Quay lại
                </button>

                <button
                  type="submit"
                  disabled={!selectedStudentForParent}
                  className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    selectedStudentForParent
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>
                    {selectedStudentForParent
                      ? `Đăng Nhập Xem Hồ Sơ (${selectedStudentForParent.name}) ➜`
                      : 'Vui Lòng Chạm Chọn Tên Học Sinh Ở Trên'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
