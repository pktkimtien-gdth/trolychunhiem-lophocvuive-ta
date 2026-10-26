import React, { useMemo } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { getAcademicYearInfo } from '../../utils/dateUtils';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Award, 
  Flame, 
  TrendingUp, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface WeeklyProgressBarProps {
  selectedWeek?: string;
  onViewAssignments?: () => void;
  className?: string;
}

export const WeeklyProgressBar: React.FC<WeeklyProgressBarProps> = ({
  selectedWeek,
  onViewAssignments,
  className = '',
}) => {
  const { classTasks, students, currentStudent, role } = useClassroom();
  const academicInfo = useMemo(() => getAcademicYearInfo(), []);

  // Determine effective week for calculation
  const effectiveWeek = useMemo(() => {
    if (selectedWeek && selectedWeek !== 'Tất cả các tuần') {
      return selectedWeek;
    }
    return academicInfo.weekLabel;
  }, [selectedWeek, academicInfo.weekLabel]);

  // Tasks belonging to this week
  const weekTasks = useMemo(() => {
    return classTasks.filter((t) => !t.isDraft && t.week === effectiveWeek);
  }, [classTasks, effectiveWeek]);

  // Progress metrics calculation
  const metrics = useMemo(() => {
    const totalTasksCount = weekTasks.length;

    if (totalTasksCount === 0) {
      return {
        percent: 100,
        completedCount: 0,
        totalTarget: 0,
        pendingCount: 0,
        statusText: 'Tuần này chưa có bài tập mới cần nộp',
        statusEmoji: '🌱',
        badgeColor: 'bg-emerald-500',
        quote: 'Tuần học thảnh thơi, hãy cùng ôn tập lại bài học cũ nhé!',
        fullyCompletedStudentsCount: students.length,
      };
    }

    // If viewing as a specific student
    if (role === 'student' && currentStudent) {
      // Find tasks assigned to this student
      const assignedTasks = weekTasks.filter((task) => {
        if (task.assignedToType === 'all') return true;
        if (task.assignedToType === 'group' && task.assignedGroup === currentStudent.group) return true;
        if (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(currentStudent.id)) return true;
        return false;
      });

      const totalTarget = assignedTasks.length;
      if (totalTarget === 0) {
        return {
          percent: 100,
          completedCount: 0,
          totalTarget: 0,
          pendingCount: 0,
          statusText: 'Em đã hoàn thành tất cả nhiệm vụ được giao!',
          statusEmoji: '🎉',
          badgeColor: 'bg-emerald-500',
          quote: 'Tuyệt vời! Em đã hoàn thành xuất sắc các nhiệm vụ của tuần!',
          fullyCompletedStudentsCount: 1,
        };
      }

      let completedCount = 0;
      assignedTasks.forEach((task) => {
        const record = task.studentRecords[currentStudent.id];
        if (record && (record.status === 'completed' || record.status === 'submitted')) {
          completedCount++;
        }
      });

      const percent = Math.min(100, Math.round((completedCount / totalTarget) * 100));
      const pendingCount = totalTarget - completedCount;

      let statusEmoji = '🌱';
      let statusText = 'Khởi động tuần học';
      let badgeColor = 'bg-blue-500';
      let quote = 'Mỗi ngày tích lũy một chút kiến thức, em sẽ tiến bộ vượt bậc!';

      if (percent >= 100) {
        statusEmoji = '🏆';
        statusText = 'Hoàn thành xuất sắc 100%';
        badgeColor = 'bg-emerald-500';
        quote = 'Chúc mừng em! Đã hoàn thành trọn vẹn toàn bộ nhiệm vụ tuần này!';
      } else if (percent >= 75) {
        statusEmoji = '🔥';
        statusText = 'Sắp về đích rồi';
        badgeColor = 'bg-orange-500';
        quote = 'Chỉ còn một chút nữa thôi, cố gắng hoàn thành nốt nhé!';
      } else if (percent >= 50) {
        statusEmoji = '⭐';
        statusText = 'Đạt trên một nửa chặng đường';
        badgeColor = 'bg-amber-500';
        quote = 'Tiến độ rất tốt, hãy duy trì phong độ chăm chỉ này nhé!';
      } else if (percent > 0) {
        statusEmoji = '🚀';
        statusText = 'Đang tăng tốc';
        badgeColor = 'bg-indigo-500';
        quote = 'Khởi đầu thuận lợi! Tiếp tục hoàn thành các bài còn lại nào!';
      }

      return {
        percent,
        completedCount,
        totalTarget,
        pendingCount,
        statusText,
        statusEmoji,
        badgeColor,
        quote,
        fullyCompletedStudentsCount: percent === 100 ? 1 : 0,
      };
    }

    // Teacher / Class-wide overview metrics
    let totalAssignmentsAcrossClass = 0;
    let totalCompletedAssignments = 0;

    // Track completion per student
    const studentCompletionMap: Record<string, { total: number; completed: number }> = {};
    students.forEach((s) => {
      studentCompletionMap[s.id] = { total: 0, completed: 0 };
    });

    weekTasks.forEach((task) => {
      students.forEach((student) => {
        let isAssigned = false;
        if (task.assignedToType === 'all') isAssigned = true;
        else if (task.assignedToType === 'group' && task.assignedGroup === student.group) isAssigned = true;
        else if (task.assignedToType === 'custom' && task.assignedStudentIds?.includes(student.id)) isAssigned = true;

        if (isAssigned) {
          totalAssignmentsAcrossClass++;
          studentCompletionMap[student.id].total++;

          const rec = task.studentRecords[student.id];
          if (rec && (rec.status === 'completed' || rec.status === 'submitted')) {
            totalCompletedAssignments++;
            studentCompletionMap[student.id].completed++;
          }
        }
      });
    });

    const percent = totalAssignmentsAcrossClass > 0
      ? Math.min(100, Math.round((totalCompletedAssignments / totalAssignmentsAcrossClass) * 100))
      : 100;

    const pendingCount = totalAssignmentsAcrossClass - totalCompletedAssignments;

    let fullyCompletedStudentsCount = 0;
    students.forEach((s) => {
      const info = studentCompletionMap[s.id];
      if (info.total > 0 && info.completed >= info.total) {
        fullyCompletedStudentsCount++;
      }
    });

    let statusEmoji = '🌱';
    let statusText = 'Tiến độ mở đầu tuần';
    let badgeColor = 'bg-blue-500';
    let quote = 'Cô Kim Tiến nhắc cả lớp theo dõi và hoàn thành bài tập đúng hạn nhé!';

    if (percent >= 90) {
      statusEmoji = '🏆';
      statusText = 'Toàn lớp xuất sắc đạt đỉnh tiến độ';
      badgeColor = 'bg-emerald-500';
      quote = `Lớp 5B.2 xuất sắc! ${fullyCompletedStudentsCount}/${students.length} bạn đã hoàn thành trọn vẹn tuần này!`;
    } else if (percent >= 70) {
      statusEmoji = '🔥';
      statusText = 'Tiến độ rất cao - Về đích tốt';
      badgeColor = 'bg-orange-500';
      quote = 'Phong trào học tập của lớp đang rất sôi nổi, cả lớp cùng nỗ lực nhé!';
    } else if (percent >= 40) {
      statusEmoji = '⭐';
      statusText = 'Đang tích cực thi đua làm bài';
      badgeColor = 'bg-amber-500';
      quote = 'Nhiều bạn đã hoàn thành bài tập sớm để tích lũy Xu đổi quà!';
    } else if (percent > 0) {
      statusEmoji = '🚀';
      statusText = 'Đang bắt đầu nộp bài';
      badgeColor = 'bg-indigo-500';
      quote = 'Cô giáo đã giao các phiếu bài tập tuần, các em hãy vào làm ngay nhé!';
    }

    return {
      percent,
      completedCount: totalCompletedAssignments,
      totalTarget: totalAssignmentsAcrossClass,
      pendingCount,
      statusText,
      statusEmoji,
      badgeColor,
      quote,
      fullyCompletedStudentsCount,
    };
  }, [weekTasks, role, currentStudent, students]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 p-4 sm:p-6 border border-blue-100/80 shadow-md shadow-blue-500/5 transition-all ${className}`}
    >
      {/* Decorative Background Accent */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-amber-400/10 to-pink-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-wider uppercase text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-lg">
                  {effectiveWeek}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {academicInfo.academicYear} • {academicInfo.semester}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center space-x-1.5 mt-0.5">
                <span>{metrics.statusEmoji}</span>
                <span>{metrics.statusText}</span>
              </h2>
            </div>
          </div>

          {/* Quick stats badge / view assignments action */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-2xl px-3 py-1.5 flex items-center space-x-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {role === 'student' ? 'Hoàn thành' : 'Tỷ lệ toàn lớp'}
                </div>
                <div className="text-sm font-black text-slate-900 leading-none">
                  {metrics.percent}%
                </div>
              </div>
            </div>

            {onViewAssignments && (
              <button
                onClick={onViewAssignments}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1 shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
                title="Xem danh sách bài tập tuần này"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bài tập tuần</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Animated Progress Bar Container */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Tiến độ nhiệm vụ tuần</span>
            </div>
            <span className="font-black text-blue-700 text-sm">
              {metrics.percent}%
            </span>
          </div>

          <div className="h-4 w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${
                metrics.percent >= 90
                  ? 'from-emerald-500 via-teal-400 to-green-500 shadow-emerald-500/50'
                  : metrics.percent >= 60
                  ? 'from-blue-600 via-indigo-500 to-cyan-400 shadow-blue-500/50'
                  : metrics.percent >= 30
                  ? 'from-amber-500 via-orange-400 to-yellow-400 shadow-amber-500/50'
                  : 'from-blue-500 to-indigo-600 shadow-blue-500/50'
              } shadow-sm relative`}
              style={{ width: `${Math.max(6, metrics.percent)}%` }}
            >
              {/* Highlight Shimmer Reflection */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent rounded-full" />
            </div>
          </div>
        </div>

        {/* Breakdown Badges & Teacher's Note */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-white/80 rounded-xl p-2 border border-slate-100 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold">Đã nộp/Hoàn thành</div>
              <div className="font-black text-slate-800">
                {metrics.completedCount} {role === 'student' ? 'bài' : 'lượt'}
              </div>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-2 border border-slate-100 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold">Chờ thực hiện</div>
              <div className="font-black text-slate-800">
                {metrics.pendingCount} {role === 'student' ? 'bài' : 'lượt'}
              </div>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-2 border border-slate-100 flex items-center space-x-2">
            <Award className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold">
                {role === 'student' ? 'Nhiệm vụ tuần' : 'Bạn đạt 100%'}
              </div>
              <div className="font-black text-slate-800">
                {role === 'student'
                  ? `${metrics.totalTarget} bài`
                  : `${metrics.fullyCompletedStudentsCount}/${students.length} bạn`}
              </div>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-2 border border-slate-100 flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold">Khen thưởng tuần</div>
              <div className="font-black text-rose-700">+10 Xu/bài</div>
            </div>
          </div>
        </div>

        {/* Motivational Note */}
        <div className="p-2.5 bg-blue-50/60 rounded-2xl border border-blue-100/60 flex items-start space-x-2 text-xs text-blue-900 font-medium">
          <span className="text-base shrink-0">👩‍🏫</span>
          <p className="leading-relaxed">
            <strong className="font-black text-blue-950">Cô Kim Tiến: </strong>
            <span>{metrics.quote}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
