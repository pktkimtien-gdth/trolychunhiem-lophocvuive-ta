import React from 'react';
import { Student } from '../types';
import { Award, ShieldCheck, Sparkles, Star, Trophy } from 'lucide-react';

export interface MedalTierInfo {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  minPoints: number;
  nextTierPoints: number;
  icon: string;
  gradient: string;
  textColor: string;
  borderColor: string;
  bgLight: string;
  description: string;
}

export function getStudentMedalTier(points: number): MedalTierInfo {
  if (points >= 200) {
    return {
      tier: 'diamond',
      name: 'Bậc Thầy Tri Thức Kim Cương',
      minPoints: 200,
      nextTierPoints: 200,
      icon: '👑',
      gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
      textColor: 'text-cyan-900',
      borderColor: 'border-cyan-300',
      bgLight: 'bg-cyan-50',
      description: 'Đỉnh cao thi đua học tập và rèn luyện đạo đức xuất sắc của Lớp 5B.2!',
    };
  }
  if (points >= 100) {
    return {
      tier: 'platinum',
      name: 'Chiến Binh Bạch Kim Xuất Sắc',
      minPoints: 100,
      nextTierPoints: 200,
      icon: '💎',
      gradient: 'from-indigo-400 via-purple-500 to-pink-500',
      textColor: 'text-purple-900',
      borderColor: 'border-purple-300',
      bgLight: 'bg-purple-50',
      description: 'Thành tích nổi bật, hoàn thành liên tục các phiếu bài tập và đóng góp tích cực!',
    };
  }
  if (points >= 60) {
    return {
      tier: 'gold',
      name: 'Kiện Tướng Học Tập Huy Chương Vàng',
      minPoints: 60,
      nextTierPoints: 100,
      icon: '🥇',
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      textColor: 'text-amber-950',
      borderColor: 'border-amber-300',
      bgLight: 'bg-amber-50',
      description: 'Gương mẫu trong giờ học, tự giác học tập và làm bài đầy đủ đúng hạn!',
    };
  }
  if (points >= 30) {
    return {
      tier: 'silver',
      name: 'Học Sinh Tiến Bộ Huy Chương Bạc',
      minPoints: 30,
      nextTierPoints: 60,
      icon: '🥈',
      gradient: 'from-slate-300 via-slate-400 to-zinc-500',
      textColor: 'text-slate-800',
      borderColor: 'border-slate-300',
      bgLight: 'bg-slate-50',
      description: 'Nỗ lực không ngừng, đạt nhiều bước tiến vững chắc trong từng tuần học!',
    };
  }
  return {
    tier: 'bronze',
    name: 'Mầm Non Chăm Chỉ Huy Chương Đồng',
    minPoints: 0,
    nextTierPoints: 30,
    icon: '🥉',
    gradient: 'from-amber-600 via-amber-700 to-amber-800',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-400/50',
    bgLight: 'bg-amber-50/60',
    description: 'Bắt đầu hành trình tích lũy Xu và Sao thi đua mỗi ngày đến trường!',
  };
}

interface AchievementBadgeProps {
  student?: Student;
  points?: number; // Custom coins + stars if student not passed directly
  variant?: 'badge' | 'medal' | 'card' | 'compact';
  showDetails?: boolean;
  className?: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  student,
  points: customPoints,
  variant = 'badge',
  showDetails = true,
  className = '',
}) => {
  const points = student ? (student.coins || 0) + (student.stars || 0) : (customPoints || 0);
  const tier = getStudentMedalTier(points);

  // Calculate progress toward next tier
  const progressPercent = tier.tier === 'diamond'
    ? 100
    : Math.min(100, Math.max(0, Math.round(((points - tier.minPoints) / (tier.nextTierPoints - tier.minPoints)) * 100)));

  const pointsToNext = tier.tier === 'diamond' ? 0 : Math.max(0, tier.nextTierPoints - points);

  if (variant === 'medal') {
    return (
      <div
        className={`inline-flex items-center justify-center p-2 rounded-2xl ${tier.bgLight} border ${tier.borderColor} shadow-2xs ${className}`}
        title={`${tier.name} (${points} điểm tích lũy)`}
      >
        <span className="text-xl sm:text-2xl animate-bounce leading-none">{tier.icon}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-black ${tier.bgLight} ${tier.textColor} border ${tier.borderColor} shadow-2xs ${className}`}
      >
        <span>{tier.icon}</span>
        <span className="truncate max-w-[130px]">{tier.name.split(' ')[0]} {tier.name.split(' ')[1]}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-3xl p-5 ${tier.bgLight} border-2 ${tier.borderColor} shadow-md space-y-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tier.gradient} flex items-center justify-center text-2xl shadow-md text-white`}>
              {tier.icon}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Huy chương thi đua
                </span>
              </div>
              <h4 className={`text-base font-black ${tier.textColor}`}>
                {tier.name}
              </h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">Tổng tích lũy</span>
            <span className="text-lg font-black text-slate-900">{points} điểm</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {tier.description}
        </p>

        {/* Progress towards next medal tier */}
        {tier.tier !== 'diamond' ? (
          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Tiến độ lên hạng tiếp theo</span>
              <span className="font-black text-blue-700">Cần thêm {pointsToNext} điểm</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60 text-xs font-black text-cyan-800">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Chúc mừng bạn đã đạt cấp bậc vinh danh tối cao của Lớp 5B.2!</span>
          </div>
        )}

        {/* Special student badges if available */}
        {student?.badges && student.badges.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
              Danh hiệu danh dự đạt được
            </span>
            <div className="flex flex-wrap gap-1.5">
              {student.badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs"
                >
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{badge}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default 'badge' variant
  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl ${tier.bgLight} border ${tier.borderColor} shadow-2xs ${className}`}
      title={`${tier.name}: ${tier.description}`}
    >
      <span className="text-base leading-none">{tier.icon}</span>
      <div className="text-left">
        <span className={`text-xs font-black block leading-tight ${tier.textColor}`}>
          {tier.name}
        </span>
        {showDetails && (
          <span className="text-[10px] font-bold text-slate-500 block">
            {points} điểm • {tier.tier === 'diamond' ? 'Cấp tối cao' : `Còn ${pointsToNext}đ lên hạng`}
          </span>
        )}
      </div>
    </div>
  );
};
