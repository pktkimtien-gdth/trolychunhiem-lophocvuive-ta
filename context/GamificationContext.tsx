import React, { createContext, useContext, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { GiftItem, RedemptionRecord, RewardHistoryItem } from '../types';
import { INITIAL_GIFTS, INITIAL_REDEMPTIONS, INITIAL_REWARD_HISTORY } from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';
import { generateUUID } from '../utils/uuid';

export interface GamificationContextType {
  gifts: GiftItem[];
  redemptions: RedemptionRecord[];
  rewardHistory: RewardHistoryItem[];
  studentUnlockedSupplies: Record<string, string[]>;
  redeemGift: (gift: GiftItem, studentCoins: number, onDeductCoins: (amount: number) => void) => { success: boolean; message: string };
  deliverGift: (redemptionId: string) => void;
  addGift: (gift: Omit<GiftItem, 'id'>) => void;
  updateGift: (gift: GiftItem) => void;
  recordReward: (reward: Omit<RewardHistoryItem, 'id' | 'createdAt'>) => void;
  revokeReward: (rewardId: string, reason: string) => void;
  unlockSchoolSupply: (
    studentId: string,
    supplyId: string,
    cost: number,
    studentCoins: number,
    onDeductCoins: (amount: number) => void
  ) => { success: boolean; message: string };
  setGiftsDirectly: (gifts: GiftItem[]) => void;
  setRedemptionsDirectly: (redemptions: RedemptionRecord[]) => void;
  setRewardHistoryDirectly: (rewards: RewardHistoryItem[]) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gifts, setGifts] = useDebouncedLocalStorage<GiftItem[]>(
    STORAGE_KEY_PREFIX + 'gifts',
    () => INITIAL_GIFTS
  );

  const [redemptions, setRedemptions] = useDebouncedLocalStorage<RedemptionRecord[]>(
    STORAGE_KEY_PREFIX + 'redemptions',
    () => INITIAL_REDEMPTIONS
  );

  const [rewardHistory, setRewardHistory] = useDebouncedLocalStorage<RewardHistoryItem[]>(
    STORAGE_KEY_PREFIX + 'reward_history',
    () => INITIAL_REWARD_HISTORY
  );

  const [studentUnlockedSupplies, setStudentUnlockedSupplies] = useDebouncedLocalStorage<Record<string, string[]>>(
    STORAGE_KEY_PREFIX + 'unlocked_supplies',
    () => ({})
  );

  const redeemGift = useCallback((
    gift: GiftItem,
    studentCoins: number,
    onDeductCoins: (amount: number) => void
  ) => {
    if (studentCoins < gift.coinsRequired) {
      sounds.playWrong();
      return { success: false, message: 'Số xu của em chưa đủ để đổi phần quà này.' };
    }

    if (gift.stock <= 0) {
      sounds.playWrong();
      return { success: false, message: 'Phần quà này tạm thời đã hết hàng trong kho.' };
    }

    onDeductCoins(gift.coinsRequired);

    setGifts((prev) =>
      prev.map((g) => (g.id === gift.id ? { ...g, stock: Math.max(0, g.stock - 1) } : g))
    );

    const record: RedemptionRecord = {
      id: `red_${generateUUID()}`,
      studentId: 'current',
      studentName: 'Em',
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      coinsSpent: gift.coinsRequired,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    setRedemptions((prev) => [record, ...prev]);
    sounds.playCoin();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    return { success: true, message: `Chúc mừng em đã đổi thành công "${gift.name}"!` };
  }, [setGifts, setRedemptions]);

  const deliverGift = useCallback((redemptionId: string) => {
    setRedemptions((prev) =>
      prev.map((r) => (r.id === redemptionId ? { ...r, status: 'delivered' } : r))
    );
    sounds.playCorrect();
  }, [setRedemptions]);

  const addGift = useCallback((giftData: Omit<GiftItem, 'id'>) => {
    const newGift: GiftItem = { ...giftData, id: `g_${generateUUID()}` };
    setGifts((prev) => [...prev, newGift]);
    sounds.playCorrect();
  }, [setGifts]);

  const updateGift = useCallback((updated: GiftItem) => {
    setGifts((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    sounds.playCorrect();
  }, [setGifts]);

  const recordReward = useCallback((rewardData: Omit<RewardHistoryItem, 'id' | 'createdAt'>) => {
    const item: RewardHistoryItem = {
      ...rewardData,
      id: `reward_${generateUUID()}`,
      createdAt: new Date().toISOString(),
    };
    setRewardHistory((prev) => [item, ...prev]);
  }, [setRewardHistory]);

  const revokeReward = useCallback((rewardId: string, reason: string) => {
    setRewardHistory((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, isRevoked: true, revokeReason: reason } : r))
    );
    sounds.playWrong();
  }, [setRewardHistory]);

  const unlockSchoolSupply = useCallback((
    studentId: string,
    supplyId: string,
    cost: number,
    studentCoins: number,
    onDeductCoins: (amount: number) => void
  ) => {
    const unlocked = studentUnlockedSupplies[studentId] || [];
    if (unlocked.includes(supplyId)) {
      return { success: false, message: 'Em đã sở hữu đồ dùng học tập này rồi.' };
    }

    if (studentCoins < cost) {
      sounds.playWrong();
      return { success: false, message: `Em cần thêm ${cost - studentCoins} xu nữa để sưu tập món này.` };
    }

    onDeductCoins(cost);

    setStudentUnlockedSupplies((prev) => ({
      ...prev,
      [studentId]: [...(prev[studentId] || []), supplyId],
    }));

    sounds.playCorrect();
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}

    return { success: true, message: 'Chúc mừng em đã sưu tập thêm một đồ dùng học tập mới!' };
  }, [studentUnlockedSupplies, setStudentUnlockedSupplies]);

  const value = useMemo<GamificationContextType>(() => ({
    gifts,
    redemptions,
    rewardHistory,
    studentUnlockedSupplies,
    redeemGift,
    deliverGift,
    addGift,
    updateGift,
    recordReward,
    revokeReward,
    unlockSchoolSupply,
    setGiftsDirectly: setGifts,
    setRedemptionsDirectly: setRedemptions,
    setRewardHistoryDirectly: setRewardHistory,
  }), [
    gifts,
    redemptions,
    rewardHistory,
    studentUnlockedSupplies,
    redeemGift,
    deliverGift,
    addGift,
    updateGift,
    recordReward,
    revokeReward,
    unlockSchoolSupply,
    setGifts,
    setRedemptions,
    setRewardHistory,
  ]);

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
