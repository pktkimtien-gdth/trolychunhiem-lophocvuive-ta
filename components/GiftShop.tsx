import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { GiftItem } from '../types';
import { soundEffects } from '../utils/soundEffects';
import {
  Gift,
  Coins,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Package,
  Award,
  ChevronRight,
  ShieldCheck,
  Smile
} from 'lucide-react';

interface GiftShopProps {
  onOpenStudentLogin: () => void;
}

export const GiftShop: React.FC<GiftShopProps> = ({ onOpenStudentLogin }) => {
  const {
    gifts,
    redeemGift,
    deliverGift,
    redemptions,
    currentStudent,
    isTeacherLoggedIn,
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<'shop' | 'my-bag' | 'teacher-deliver'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [messageNotice, setMessageNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const categories = [
    { id: 'all', label: 'Tất Cả Quà Tặng' },
    { id: 'dung_cu', label: '✏️ Dụng Cụ Học Tập' },
    { id: 'dac_quyen', label: '👑 Đặc Quyền Lớp Học' },
    { id: 'huy_hieu', label: '⭐ Huy Hiệu Danh Dự' },
  ];

  const filteredGifts = gifts.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  const handleRedeem = (gift: GiftItem) => {
    if (!currentStudent) {
      onOpenStudentLogin();
      return;
    }

    const res = redeemGift(gift);
    if (res.success) {
      soundEffects.playBigCoin();
    }
    setMessageNotice({
      text: res.message,
      type: res.success ? 'success' : 'error',
    });

    setTimeout(() => {
      setMessageNotice(null);
    }, 4000);
  };

  // Student's own redeemed gifts
  const myRedemptions = currentStudent
    ? redemptions.filter((r) => r.studentId === currentStudent.id)
    : [];

  const pendingDeliveries = redemptions.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Cửa Hàng Quà Tặng Ảo
              </h1>
              <span className="bg-pink-100 text-pink-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Gift className="w-3.5 h-3.5 text-pink-600" />
                <span>Đổi Điểm Thật • Phát Quà Tại Lớp</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Học sinh dùng Xu tích lũy qua bài tập và trò chơi để tự chọn đổi quà. Thầy cô phát quà thật ngay trên lớp!
            </p>
          </div>

          {/* Student Balance Card */}
          {currentStudent ? (
            <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-3 shadow-xs">
              <img
                src={currentStudent.avatar}
                alt={currentStudent.name}
                className="w-10 h-10 rounded-full border border-amber-300 bg-white"
              />
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  Số dư của {currentStudent.name}:
                </span>
                <div className="text-base font-black text-amber-700 flex items-center space-x-1">
                  <span>🪙 {currentStudent.coins} Xu Thưởng</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenStudentLogin}
              className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition-all"
            >
              Chọn Tên Em Để Đổi Quà
            </button>
          )}
        </div>

        {/* Notice Banner */}
        {messageNotice && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs sm:text-sm font-bold animate-in fade-in ${
              messageNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {messageNotice.text}
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center space-x-2 pt-5 border-t border-slate-100 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'shop'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Gian Hàng Đổi Quà</span>
          </button>

          <button
            onClick={() => setActiveTab('my-bag')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'my-bag'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Túi Quà Của Em ({myRedemptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teacher-deliver')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'teacher-deliver'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Danh Sách Phát Quà Tại Lớp ({pendingDeliveries.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GIAN HÀNG ĐỔI QUÀ */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Gifts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredGifts.map((gift) => {
              const canAfford = currentStudent ? currentStudent.coins >= gift.coinsRequired : false;

              return (
                <div
                  key={gift.id}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-200/80 hover:border-pink-300 hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Item Image / Visual Icon Container */}
                    <div
                      className={`w-full h-36 rounded-2xl bg-gradient-to-tr ${gift.imageColor} flex items-center justify-center text-5xl shadow-inner group-hover:scale-[1.02] transition-transform relative`}
                    >
                      <span>{gift.icon}</span>

                      {/* Stock Badge */}
                      <span className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        Còn {gift.stock} món
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-black text-base text-slate-900 mt-4 group-hover:text-pink-600 transition-colors">
                      {gift.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                      {gift.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1 text-amber-700 font-black text-sm">
                      <span>🪙</span>
                      <span>{gift.coinsRequired} Xu</span>
                    </div>

                    <button
                      onClick={() => handleRedeem(gift)}
                      disabled={gift.stock === 0}
                      className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all active:scale-95 ${
                        gift.stock === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-pink-500/20'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      }`}
                    >
                      {gift.stock === 0 ? 'Hết hàng' : canAfford ? 'Đổi Quà Ngay' : 'Thiếu Xu'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TÚI QUÀ CỦA EM */}
      {activeTab === 'my-bag' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">
              Các Món Quà Em Đã Đổi Thưởng ({myRedemptions.length})
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Giáo viên sẽ xem danh sách và phát quà tận tay em ở lớp học!
            </span>
          </div>

          <div className="space-y-3">
            {myRedemptions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl shadow-xs">
                    {item.giftIcon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {item.giftName}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Thời gian đổi: {item.timestamp} • Đã trừ {item.coinsSpent} Xu
                    </p>
                  </div>
                </div>

                <div>
                  {item.status === 'delivered' ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã nhận quà tại lớp</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center space-x-1 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Chờ thầy cô phát quà tại lớp</span>
                    </span>
                  )}
                </div>
              </div>
            ))}

            {myRedemptions.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">Túi quà của em hiện đang trống</p>
                <p className="text-xs text-slate-400 mt-1">
                  Hãy làm bài tập hoặc tham gia trò chơi Camera AI để tích lũy xu và đổi quà nhé!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DANH SÁCH GIÁO VIÊN PHÁT QUÀ */}
      {activeTab === 'teacher-deliver' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                Danh Sách Học Sinh Chờ Phát Quà Thật Tại Lớp
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dành cho giáo viên: Kiểm tra quà và bấm xác nhận khi đã trao quà cho học sinh
              </p>
            </div>
            <span className="bg-purple-100 text-purple-900 font-black text-xs px-3 py-1.5 rounded-full">
              {pendingDeliveries.length} món quà chờ phát
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">Học Sinh</th>
                  <th className="py-3 px-3">Món Quà Đổi</th>
                  <th className="py-3 px-3">Số Xu</th>
                  <th className="py-3 px-3">Thời Gian Đổi</th>
                  <th className="py-3 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {r.studentName}
                    </td>
                    <td className="py-3 px-3 flex items-center space-x-2">
                      <span className="text-lg">{r.giftIcon}</span>
                      <span className="font-semibold text-slate-800">{r.giftName}</span>
                    </td>
                    <td className="py-3 px-3 font-black text-amber-700">
                      🪙 {r.coinsSpent} xu
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      {r.timestamp}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {r.status === 'delivered' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                          Đã trao quà
                        </span>
                      ) : (
                        <button
                          onClick={() => deliverGift(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                        >
                          Xác nhận đã phát quà
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {redemptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có học sinh nào đổi quà trong hệ thống.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
