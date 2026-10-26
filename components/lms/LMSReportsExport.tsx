import React, { useState, useMemo } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { Student, ClassTask } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Users,
  Award,
  Sparkles,
  TrendingUp,
  FileText,
  Search,
  Check
} from 'lucide-react';

interface LMSReportsExportProps {
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
}

export const LMSReportsExport: React.FC<LMSReportsExportProps> = ({
  selectedWeek,
  setSelectedWeek,
}) => {
  const { students, classTasks } = useClassroom();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [exportSuccess, setExportSuccess] = useState(false);

  const subjects = [
    { id: 'all', label: 'Tất cả môn học' },
    { id: 'Toán', label: 'Toán' },
    { id: 'Tiếng Việt', label: 'Tiếng Việt' },
    { id: 'Khoa học', label: 'Khoa học' },
    { id: 'Lịch sử và Địa lí', label: 'Lịch sử & Địa lí' },
    { id: 'Tin học', label: 'Tin học' },
    { id: 'Tiếng Anh', label: 'Tiếng Anh' },
    { id: 'Hoạt động trải nghiệm', label: 'HĐ Trải nghiệm' },
  ];

  const availableWeeks = ['Tuần 24', 'Tuần 23', 'Tuần 22', 'Tất cả các tuần'];

  // Filter tasks based on selected week and subject
  const filteredTasks = useMemo(() => {
    return classTasks.filter((t) => {
      const matchWeek =
        selectedWeek === 'Tất cả các tuần' ||
        (t.week && t.week.toLowerCase() === selectedWeek.toLowerCase()) ||
        (!t.week && selectedWeek === 'Tuần 24');
      const matchSub =
        selectedSubject === 'all' ||
        t.subject.toLowerCase() === selectedSubject.toLowerCase();
      return matchWeek && matchSub;
    });
  }, [classTasks, selectedWeek, selectedSubject]);

  // Aggregate student completion data
  const studentReports = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return students
      .filter((s) => selectedGroup === 'all' || s.group === selectedGroup)
      .map((student, idx) => {
        let totalAssigned = 0;
        let completedCount = 0;
        let submittedCount = 0;
        let needsRevisionCount = 0;
        let overdueCount = 0;
        let totalScore = 0;
        let scoreItemsCount = 0;

        filteredTasks.forEach((task) => {
          const isApplicable =
            task.assignedToType === 'all' ||
            (task.assignedToType === 'group' && student.group === task.assignedGroup) ||
            (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(student.id));

          if (!isApplicable) return;
          totalAssigned++;

          const rec = task.studentRecords[student.id] || { status: 'not_started' };
          const isOverdue =
            rec.status !== 'completed' &&
            rec.status !== 'submitted' &&
            (rec.status === 'late' || Boolean(task.dueDate && task.dueDate < todayStr));

          if (rec.status === 'completed') {
            completedCount++;
            if (rec.score !== undefined) {
              totalScore += rec.score;
              scoreItemsCount++;
            }
          } else if (rec.status === 'submitted') {
            submittedCount++;
          } else if (rec.status === 'needs_revision') {
            needsRevisionCount++;
          }

          if (isOverdue) overdueCount++;
        });

        const missingCount = totalAssigned - completedCount;
        const completionRate =
          totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 100;
        const avgScore = scoreItemsCount > 0 ? (totalScore / scoreItemsCount).toFixed(1) : '-';

        return {
          ...student,
          stt: idx + 1,
          totalAssigned,
          completedCount,
          submittedCount,
          needsRevisionCount,
          missingCount,
          overdueCount,
          completionRate,
          avgScore,
          isFullCompleted: totalAssigned > 0 && completedCount === totalAssigned,
        };
      });
  }, [students, filteredTasks, selectedGroup]);

  // Overall Class Statistics
  const summary = useMemo(() => {
    const totalStudents = studentReports.length;
    const fullyDone = studentReports.filter((s) => s.isFullCompleted).length;
    const withMissing = studentReports.filter((s) => s.missingCount > 0);
    const avgClassRate =
      totalStudents > 0
        ? Math.round(
            studentReports.reduce((acc, s) => acc + s.completionRate, 0) / totalStudents
          )
        : 0;

    let totalTasksAssigned = filteredTasks.length;
    let totalSubmissions = 0;
    let totalGraded = 0;
    let totalOverdue = 0;

    studentReports.forEach((s) => {
      totalSubmissions += s.completedCount + s.submittedCount;
      totalGraded += s.completedCount;
      totalOverdue += s.overdueCount;
    });

    return {
      totalStudents,
      fullyDone,
      withMissing,
      avgClassRate,
      totalTasksAssigned,
      totalSubmissions,
      totalGraded,
      totalOverdue,
    };
  }, [studentReports, filteredTasks]);

  // Week-over-week comparative stats
  const weeklyComparisons = useMemo(() => {
    return [
      { week: 'Tuần 22', tasks: 4, completionRate: 92, note: 'Hoàn thành tốt' },
      { week: 'Tuần 23', tasks: 5, completionRate: 88, note: 'Ổn định' },
      { week: 'Tuần 24', tasks: filteredTasks.length || 5, completionRate: summary.avgClassRate, note: 'Đang diễn ra' },
    ];
  }, [filteredTasks, summary.avgClassRate]);

  // Real CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    soundEffects.playClick();

    const headers = [
      'STT',
      'Họ và Tên',
      'Mã Học Sinh',
      'Tổ',
      'Số Bài Đã Giao',
      'Số Bài Hoàn Thành',
      'Số Bài Chưa Nộp',
      'Số Bài Quá Hạn',
      'Tỷ Lệ Hoàn Thành (%)',
      'Điểm Trung Bình',
      'Ghi Chú',
    ];

    const rows = studentReports.map((s) => [
      s.stt,
      `"${s.name}"`,
      `"${s.studentCode || `HS5B2-${s.stt}`}"`,
      `"${s.group || 'Tổ 1'}"`,
      s.totalAssigned,
      s.completedCount,
      s.missingCount,
      s.overdueCount,
      `${s.completionRate}%`,
      s.avgScore,
      s.isFullCompleted ? '"Hoàn thành 100%"' : s.overdueCount > 0 ? '"Có bài trễ hạn"' : '"Đang thực hiện"',
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel Vietnamese compatibility
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Tien_Do_${selectedWeek.replace(/\s+/g, '_')}_Lop_5B2.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    soundEffects.playCorrect();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-md">
              BÁO CÁO & XUẤT DỮ LIỆU
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-semibold">
              Trường Tiểu học Thân Thiện • Lớp 5B.2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Báo Cáo Tổng Hợp & Xuất Thống Kê
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dữ liệu kết xuất chuẩn xác theo bộ lọc; hỗ trợ xuất file Excel CSV tiếng Việt và in ấn phiếu báo cáo A4.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">In Báo Cáo A4</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs flex items-center space-x-1.5 transition-colors active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Xuất File Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Export Success Notification */}
      {exportSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã xuất thành công tệp CSV khớp 100% dữ liệu đang lọc!</span>
          </div>
          <span className="text-xs text-emerald-700">Mở được bằng Microsoft Excel không lỗi font</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-hidden"
            >
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-hidden"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Toàn bộ 4 Tổ</option>
              <option value="Tổ 1">Tổ 1</option>
              <option value="Tổ 2">Tổ 2</option>
              <option value="Tổ 3">Tổ 3</option>
              <option value="Tổ 4">Tổ 4</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-bold">
          Sĩ số báo cáo: <strong className="text-slate-900">{studentReports.length}</strong> học sinh
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tỷ Lệ Hoàn Thành Lớp
          </div>
          <div className="text-3xl font-black text-blue-600 mt-1">
            {summary.avgClassRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Mức độ tích cực cao
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Hoàn Thành 100%
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-1">
            {summary.fullyDone} / {summary.totalStudents}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Học sinh đạt chuẩn tuần
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Tổng Lượt Nộp & Đã Chấm
          </div>
          <div className="text-3xl font-black text-amber-600 mt-1">
            {summary.totalGraded}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Bài làm đã được chấm điểm
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
            Lượt Bài Quá Hạn
          </div>
          <div className="text-3xl font-black text-rose-600 mt-1">
            {summary.totalOverdue}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">
            Cần nhắc nhở và đôn đốc
          </div>
        </div>
      </div>

      {/* Week-over-week comparison table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="font-black text-sm text-slate-900 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>So Sánh Tiến Độ Hoàn Thành Qua Các Tuần</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {weeklyComparisons.map((item) => (
            <div
              key={item.week}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">{item.week}</span>
                <span className="text-xs font-black text-blue-600">{item.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${item.completionRate}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{item.tasks} bài tập</span>
                <span className="font-semibold text-slate-700">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Student Roster Table for Reports */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900">
            Bảng Thống Kê Chi Tiết Từng Học Sinh (Lớp 5B.2)
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Đang hiển thị {studentReports.length} học sinh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3">Họ và Tên</th>
                <th className="py-2.5 px-3">Mã HS</th>
                <th className="py-2.5 px-3 text-center">Tổ</th>
                <th className="py-2.5 px-3 text-center">Bài Giao</th>
                <th className="py-2.5 px-3 text-center">Hoàn Thành</th>
                <th className="py-2.5 px-3 text-center">Chưa Nộp</th>
                <th className="py-2.5 px-3 text-center">Quá Hạn</th>
                <th className="py-2.5 px-3 text-center">Tỷ Lệ</th>
                <th className="py-2.5 px-3 text-right">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentReports.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">{s.stt}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{s.studentCode || `HS5B2-${s.stt}`}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-600">{s.group || 'Tổ 1'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">{s.totalAssigned}</td>
                  <td className="py-2.5 px-3 text-center font-black text-emerald-700">{s.completedCount}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-700">{s.missingCount}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-700">{s.overdueCount}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-black px-2 py-0.5 rounded-md ${
                      s.completionRate === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.completionRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {s.isFullCompleted ? (
                      <span className="text-emerald-700 font-bold">Khen thưởng</span>
                    ) : s.overdueCount > 0 ? (
                      <span className="text-rose-700 font-bold">Đôn đốc</span>
                    ) : (
                      <span className="text-slate-500">Đang theo dõi</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
