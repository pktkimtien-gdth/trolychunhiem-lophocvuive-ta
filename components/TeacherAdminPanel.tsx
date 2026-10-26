import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Student, GiftItem } from '../types';
import { StudentListImportModal } from './StudentListImportModal';
import { WeeklyTimetable } from './WeeklyTimetable';
import {
  Award,
  Trophy,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  Download,
  Search,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  Calendar
} from 'lucide-react';

import { getStudentNeutralAvatar } from '../utils/studentAvatar';

export const TeacherAdminPanel: React.FC = () => {
  const {
    students,
    submissions,
    addStudent,
    deleteStudent,
    updateStudent,
    awardCoins,
    gifts,
    addGift,
    isTeacherLoggedIn,
  } = useClassroom();

  const [activeSubTab, setActiveSubTab] = useState<'ranking' | 'submissions' | 'students' | 'gifts' | 'timetable'>('ranking');

  // Search in ranking & students
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Bulk Import & Add Student State
  const [showImportRoster, setShowImportRoster] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPin, setNewStudentPin] = useState('1234');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  // Add Gift State
  const [showAddGift, setShowAddGift] = useState(false);
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftCoins, setNewGiftCoins] = useState(20);
  const [newGiftIcon, setNewGiftIcon] = useState('🎁');
  const [newGiftCategory, setNewGiftCategory] = useState<'dung_cu' | 'dac_quyen' | 'huy_hieu' | 'do_choi'>('dung_cu');
  const [newGiftStock, setNewGiftStock] = useState(10);
  const [newGiftDesc, setNewGiftDesc] = useState('');

  // Sorted Students for Leaderboard (by coins descending)
  const rankedStudents = [...students].sort((a, b) => b.coins - a.coins);

  const filteredRanked = rankedStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    addStudent({
      name: newStudentName.trim(),
      avatar: getStudentNeutralAvatar(newStudentName.trim()),
      parentPin: newStudentPin || '1234',
      notes: newStudentNotes,
      attendanceStatus: 'present',
    });

    setNewStudentName('');
    setNewStudentNotes('');
    setShowAddStudent(false);
  };

  const handleCreateGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftName.trim()) return;

    addGift({
      name: newGiftName.trim(),
      coinsRequired: Number(newGiftCoins),
      category: newGiftCategory,
      icon: newGiftIcon || '🎁',
      imageColor: 'from-amber-400 to-pink-500',
      stock: Number(newGiftStock),
      description: newGiftDesc || 'Món quà khích lệ tinh thần học sinh.',
    });

    setNewGiftName('');
    setNewGiftDesc('');
    setShowAddGift(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Thi Đua, Báo Cáo & Quản Trị
              </h1>
              <span className="bg-purple-100 text-purple-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Báo Cáo Giáo Viên & Phụ Huynh</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Theo dõi sự cố gắng của từng học sinh, quản lý danh sách lớp, kho quà tặng và xuất dữ liệu báo cáo.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const headers = ['STT', 'Họ và tên', 'Tổ', 'Số xu tích lũy', 'Sao thi đua', 'Ghi chú'];
                const rows = rankedStudents.map((s, idx) => [
                  idx + 1,
                  `"${s.name}"`,
                  `"${s.group || 'Chưa phân tổ'}"`,
                  s.coins,
                  s.stars,
                  `"${s.notes || ''}"`
                ]);
                const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Bao_Cao_Lop_5B2_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-emerald-200 flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất Báo Cáo Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center space-x-2 pt-5 border-t border-slate-100 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('ranking')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'ranking'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Bảng Vàng Thi Đua</span>
          </button>

          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Lịch Sử Làm Bài ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'students'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Học Sinh ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gifts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'gifts'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Quản Lý Quà Tặng ({gifts.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timetable')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'timetable'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thời Khóa Biểu Tuần</span>
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              Mới
            </span>
          </button>
        </div>
      </div>

      {/* TAB: THỜI KHÓA BIỂU HÀNG TUẦN */}
      {activeSubTab === 'timetable' && <WeeklyTimetable />}

      {/* TAB 1: BẢNG VÀNG THI ĐUA */}
      {activeSubTab === 'ranking' && (
        <div className="space-y-4">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankedStudents.slice(0, 3).map((st, idx) => {
              const medals = ['🥇 Quán Quân', '🥈 Á Quân 1', '🥉 Á Quân 2'];
              const borders = ['border-amber-400 bg-amber-50/50', 'border-slate-300 bg-slate-50', 'border-amber-600/40 bg-orange-50/40'];

              return (
                <div
                  key={st.id}
                  className={`rounded-3xl p-5 border-2 ${borders[idx]} shadow-sm flex flex-col items-center text-center relative overflow-hidden`}
                >
                  <div className="w-20 h-20 rounded-2xl bg-white p-1 border-2 border-amber-300 shadow-md mb-2 overflow-hidden">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-200/70 px-3 py-0.5 rounded-full mb-1">
                    {medals[idx]}
                  </span>
                  <h3 className="font-black text-lg text-slate-900">{st.name}</h3>
                  <div className="mt-2 flex items-center space-x-2 text-xs font-black">
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      🪙 {st.coins} Xu
                    </span>
                    <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      ⭐ {st.stars} Sao
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Class Ranking Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-800">
                Bảng Tổng Sắp Toàn Lớp 5B.2 (42 Học Sinh)
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên học sinh..."
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-3">Học Sinh</th>
                    <th className="py-3 px-3">Số Xu Tích Lũy</th>
                    <th className="py-3 px-3">Số Sao</th>
                    <th className="py-3 px-3">Danh Hiệu Đạt Được</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredRanked.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-black text-slate-700">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 flex items-center space-x-2.5">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-7 h-7 rounded-full bg-slate-100 border"
                        />
                        <span className="font-bold text-slate-900">{st.name}</span>
                      </td>
                      <td className="py-3 px-3 text-amber-700 font-black">
                        🪙 {st.coins} xu
                      </td>
                      <td className="py-3 px-3 text-purple-700 font-bold">
                        ⭐ {st.stars}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                          {st.badges[0] || 'Chăm Chỉ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ LÀM BÀI TẬP */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                Nhật Ký Nộp Bài & Tự Động Chấm Điểm
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Hệ thống tự động ghi nhận kết quả, tính phần trăm và cộng xu khi đạt từ 80% trở lên
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">Học Sinh</th>
                  <th className="py-3 px-3">Bài Tập</th>
                  <th className="py-3 px-3">Điểm Số</th>
                  <th className="py-3 px-3">Đạt Chuẩn (≥80%)</th>
                  <th className="py-3 px-3">Xu Thưởng</th>
                  <th className="py-3 px-3">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {sub.studentName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold max-w-xs truncate">
                      {sub.worksheetTitle}
                    </td>
                    <td className="py-3 px-3 font-black">
                      {sub.score}/{sub.totalQuestions} ({sub.percent}%)
                    </td>
                    <td className="py-3 px-3">
                      {sub.isPassed ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đạt Chuẩn (≥80%)</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          Chưa đạt 80%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-black text-amber-700">
                      🪙 +{sub.coinsEarned} Xu
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      {sub.timestamp}
                    </td>
                  </tr>
                ))}

                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Chưa có bài tập nào được nộp. Học sinh có thể làm bài trong tab "Kho Bài Tập & Chấm Điểm"!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ HỌC SINH */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                Danh Sách Học Sinh Lớp 5B.2 Vui Vẻ ({students.length} Học sinh)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                GVCN: Cô Kim Tiến Number Hi! • Thêm, nhập file danh sách, đặt mã PIN và điều chỉnh điểm thưởng
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowImportRoster(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import Excel (.xlsx/.csv)</span>
              </button>
              <button
                onClick={() => setShowAddStudent(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm 1 Học Sinh</span>
              </button>
            </div>
          </div>

          {/* Group Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
              <span className="text-xs font-bold text-slate-500 mr-1">Lọc theo Tổ:</span>
              {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((grp) => {
                const count = grp === 'all' ? students.length : students.filter((s) => s.group === grp).length;
                return (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedGroup === grp
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{grp === 'all' ? 'Toàn lớp (Tất cả)' : grp}</span>
                    <span className="ml-1 opacity-75 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm học sinh..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">Học Sinh</th>
                  <th className="py-3 px-3">Phân Tổ</th>
                  <th className="py-3 px-3">Mã PIN Phụ Huynh</th>
                  <th className="py-3 px-3">Số Xu</th>
                  <th className="py-3 px-3">Ghi Chú Rèn Luyện</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students
                  .filter((st) => (selectedGroup === 'all' || st.group === selectedGroup) && st.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
                  .map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 flex items-center space-x-2.5">
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-8 h-8 rounded-full border bg-white"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">{st.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{st.studentCode || `HS5B2-${st.id}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          st.group?.includes('1')
                            ? 'bg-blue-100 text-blue-800'
                            : st.group?.includes('2')
                            ? 'bg-purple-100 text-purple-800'
                            : st.group?.includes('3')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.group || 'Tổ 1'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {st.parentPin || '1234'}
                    </td>
                    <td className="py-3 px-3 font-black text-amber-700">
                      🪙 {st.coins} xu
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs max-w-xs truncate">
                      {st.notes || 'Chăm ngoan, tự giác'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => awardCoins(st.id, 5, 'Khen thưởng quản trị')}
                        title="Tặng +5 xu"
                        className="bg-amber-100 text-amber-800 font-black text-[11px] px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        +5 xu
                      </button>
                      <button
                        onClick={() => deleteStudent(st.id)}
                        title="Xóa học sinh"
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: QUẢN LÝ QUÀ TẶNG */}
      {activeSubTab === 'gifts' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                Kho Quà Tặng Đổi Thưởng
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Cập nhật các món quà, mức xu yêu cầu và số lượng còn lại
              </p>
            </div>

            <button
              onClick={() => setShowAddGift(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Món Quà Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="p-4 rounded-2xl border border-slate-200 flex items-center space-x-3.5 bg-slate-50/50"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-2xl shadow-xs">
                  {gift.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm text-slate-900 truncate">
                    {gift.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {gift.description}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 text-xs font-black">
                    <span className="text-amber-700">🪙 {gift.coinsRequired} Xu</span>
                    <span>•</span>
                    <span className="text-slate-600">Còn {gift.stock} món</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-purple-200 overflow-hidden">
            <div className="bg-purple-600 p-5 text-white flex items-center justify-between">
              <h3 className="text-lg font-black">Thêm Học Sinh Mới</h3>
              <button
                onClick={() => setShowAddStudent(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ và tên học sinh
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Tuấn Kiệt"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mã PIN Phụ Huynh
                </label>
                <input
                  type="text"
                  value={newStudentPin}
                  onChange={(e) => setNewStudentPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi chú / Điểm mạnh
                </label>
                <input
                  type="text"
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                  placeholder="Ví dụ: Học tốt môn Toán, nhiệt tình phát biểu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
                >
                  Lưu Học Sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Gift */}
      {showAddGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-pink-200 overflow-hidden">
            <div className="bg-pink-600 p-5 text-white flex items-center justify-between">
              <h3 className="text-lg font-black">Thêm Món Quà Mới</h3>
              <button
                onClick={() => setShowAddGift(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateGift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên món quà
                </label>
                <input
                  type="text"
                  required
                  value={newGiftName}
                  onChange={(e) => setNewGiftName(e.target.value)}
                  placeholder="Ví dụ: Bút máy mực tím điểm 10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Biểu tượng
                  </label>
                  <input
                    type="text"
                    value={newGiftIcon}
                    onChange={(e) => setNewGiftIcon(e.target.value)}
                    placeholder="✒️"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-center text-sm font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số Xu cần
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newGiftCoins}
                    onChange={(e) => setNewGiftCoins(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newGiftStock}
                    onChange={(e) => setNewGiftStock(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={newGiftDesc}
                  onChange={(e) => setNewGiftDesc(e.target.value)}
                  placeholder="Quà thưởng khích lệ bé chăm ngoan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddGift(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md"
                >
                  Thêm Quà
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import Student List */}
      <StudentListImportModal
        isOpen={showImportRoster}
        onClose={() => setShowImportRoster(false)}
      />
    </div>
  );
};
