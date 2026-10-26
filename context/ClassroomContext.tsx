import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import {
  Student,
  DeskPosition,
  Worksheet,
  GiftItem,
  RedemptionRecord,
  Submission,
  CallHistoryItem,
  UserRole,
  TimetableSubjectConfig,
  TimetableSlot,
  TimetableAdminSettings,
  TimetableSubjectId,
  AIVideoItem,
  MediaUploadItem,
  ClassTask,
  TaskStudentStatus,
  RewardHistoryItem,
  SeatingPlan
} from '../types';
import { sounds } from '../utils/audio';
import { supabase } from '../lib/supabase';

// Domain-Specific Contexts & Providers
import { AuthProvider, useAuth } from './AuthContext';
import { StudentProvider, useStudents } from './StudentContext';
import { TaskProvider, useTasks } from './TaskContext';
import { GamificationProvider, useGamification } from './GamificationContext';
import { TimetableProvider, useTimetable } from './TimetableContext';
import { MediaProvider, useMedia } from './MediaContext';

// Re-export domain hooks for granular performance optimization
export { useAuth } from './AuthContext';
export { useStudents } from './StudentContext';
export { useTasks } from './TaskContext';
export { useGamification } from './GamificationContext';
export { useTimetable } from './TimetableContext';
export { useMedia } from './MediaContext';

export interface ClassroomContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  currentUser: any;
  isAdminLoggedIn: boolean;
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  isTeacherLoggedIn: boolean;
  setIsTeacherLoggedIn: (val: boolean) => void;
  activeParentStudentId: string | null;
  setActiveParentStudentId: (id: string | null) => void;

  loginAsTeacherOrAdmin: (pin: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  loginAsTeacherWithGoogle: (email: string, name?: string, credential?: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  loginAsStudent: (student: Student) => void;
  loginAsParent: (student: Student, pin?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  switchAccount: () => void;

  students: Student[];
  desks: DeskPosition[];
  worksheets: Worksheet[];
  gifts: GiftItem[];
  redemptions: RedemptionRecord[];
  submissions: Submission[];
  callHistory: CallHistoryItem[];

  // Actions
  selectStudentLogin: (student: any) => void;
  logoutStudent: () => void;
  verifyTeacherPin: (pin: string) => boolean;
  logoutTeacher: () => void;
  isDefaultPin: boolean;
  changeTeacherPin: (
    oldPin: string,
    newPin: string,
    confirmPin: string
  ) => Promise<{ success: boolean; message: string }>;

  awardCoins: (studentId: string, amount: number, reason?: string) => void;
  updateDeskStudent: (deskId: string, studentId?: string) => void;
  swapDeskStudents: (deskAId: string, deskBId: string) => void;
  importRealStudents: (
    newRoster: Array<{
      name: string;
      group?: string;
      studentCode?: string;
      parentPin?: string;
      notes?: string;
    }>,
    mode?: 'replace' | 'append'
  ) => { count: number };
  supabase: any;
  submitWorksheetResult: (
    worksheet: Worksheet,
    answers: Record<string, number>,
    score: number,
    total: number
  ) => { isPassed: boolean; coinsAwarded: number; percent: number };

  redeemGift: (gift: GiftItem) => { success: boolean; message: string };
  deliverGift: (redemptionId: string) => void;

  addWorksheet: (ws: Worksheet) => void;
  deleteWorksheet: (id: string) => void;

  addStudent: (student: Omit<Student, 'id' | 'coins' | 'stars' | 'badges'>) => void;
  bulkImportStudents: (names: string[]) => { count: number };
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;

  addGift: (gift: Omit<GiftItem, 'id'>) => void;
  updateGift: (gift: GiftItem) => void;

  recordCallHistory: (item: Omit<CallHistoryItem, 'id' | 'timestamp'>) => void;
  resetAllData: () => void;

  // Thời khóa biểu hàng tuần & Cấu hình 12 môn học
  timetableSubjects: TimetableSubjectConfig[];
  timetableSlots: TimetableSlot[];
  timetableSettings: TimetableAdminSettings;
  updateTimetableSettings: (settings: Partial<TimetableAdminSettings>) => void;
  toggleSubjectVisibility: (subjectId: TimetableSubjectId) => void;
  setOnlyCoreSubjects: (onlyCore: boolean) => void;
  updateTimetableSlot: (slot: TimetableSlot) => void;
  bulkUpdateTimetableSlots: (slots: TimetableSlot[]) => void;
  resetTimetable: () => void;

  // Kho Video Bài Giảng AI & Đa phương tiện
  aiVideos: AIVideoItem[];
  addAIVideo: (video: Omit<AIVideoItem, 'id' | 'createdAt'>) => void;
  deleteAIVideo: (id: string) => void;
  updateAIVideo: (video: AIVideoItem) => void;

  mediaUploads: MediaUploadItem[];
  addMediaUpload: (item: Omit<MediaUploadItem, 'id' | 'uploadedAt'>) => void;
  deleteMediaUpload: (id: string) => void;

  // Quản lý học tập và thi đua Lớp 5B.2
  classTasks: ClassTask[];
  addClassTask: (task: Omit<ClassTask, 'id' | 'createdAt'>) => void;
  updateClassTask: (task: ClassTask) => void;
  deleteClassTask: (taskId: string) => void;
  updateStudentTaskStatus: (
    taskId: string,
    studentId: string,
    status: TaskStudentStatus,
    note?: string,
    score?: number
  ) => void;
  bulkUpdateStudentTaskStatus: (taskId: string, studentIds: string[], status: TaskStudentStatus) => void;

  rewardHistory: RewardHistoryItem[];
  recordReward: (reward: Omit<RewardHistoryItem, 'id' | 'createdAt'>) => void;
  revokeReward: (rewardId: string, reason: string) => void;

  seatingPlans: SeatingPlan[];
  saveSeatingPlan: (name: string, description?: string) => void;
  applySeatingPlan: (planId: string) => void;
  deleteSeatingPlan: (planId: string) => void;

  updateStudentAvatar: (studentId: string, avatarUrl: string) => void;
  exportClassroomDataJSON: () => string;
  importClassroomDataJSON: (jsonStr: string) => boolean;

  // Đồ dùng học tập & Nhiệm vụ tương tác học sinh
  studentUnlockedSupplies: Record<string, string[]>;
  unlockSchoolSupply: (studentId: string, supplyId: string, cost: number) => { success: boolean; message: string };
  submitStudentTaskAnswers: (
    taskId: string,
    studentId: string,
    answers: Record<string, any>,
    selfDeclared?: boolean,
    selfDeclaredNote?: string
  ) => void;
  verifySelfDeclaredTask: (taskId: string, studentId: string, verified: boolean) => void;
}

const ClassroomUnifiedContext = createContext<ClassroomContextType | null>(null);

/**
 * Composite context bridge that assembles all domain slices into a single unified facade
 */
const ClassroomBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const studentsSlice = useStudents();
  const tasksSlice = useTasks();
  const gamificationSlice = useGamification();
  const timetableSlice = useTimetable();
  const mediaSlice = useMedia();
// TỰ ĐỘNG KÉO DỮ LIỆU TỪ SUPABASE
  useEffect(() => {
    const fetchStudentsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('trolychunhiem_lophocvuive')
          .select('ten_hoc_sinh');
        
        if (error) {
          console.error('Lỗi khi tải dữ liệu Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          // Chuyển đổi dữ liệu từ Supabase sang định dạng của ứng dụng
          const newRoster = data.map((row: any) => ({
            name: row.ten_hoc_sinh
          }));
          // Thay thế danh sách mặc định bằng danh sách từ Supabase
          studentsSlice.importRealStudents(newRoster, 'replace');
        }
      } catch (err) {
        console.error('Lỗi kết nối Supabase:', err);
      }
    };

    fetchStudentsFromSupabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi ứng dụng tải xong
  // Cross-domain bridge handlers
  const handleRedeemGift = useCallback((gift: GiftItem) => {
    const studentCoins = auth.currentStudent?.coins ?? 0;
    const currentStudentId = auth.currentStudent?.id;

    return gamificationSlice.redeemGift(gift, studentCoins, (amount) => {
      if (currentStudentId) {
        studentsSlice.awardCoins(currentStudentId, -amount);
      }
    });
  }, [auth.currentStudent, gamificationSlice, studentsSlice]);

  const handleUnlockSchoolSupply = useCallback((studentId: string, supplyId: string, cost: number) => {
    const targetStudent = studentsSlice.students.find((s) => s.id === studentId);
    const coins = targetStudent?.coins ?? 0;

    return gamificationSlice.unlockSchoolSupply(studentId, supplyId, cost, coins, (amount) => {
      studentsSlice.awardCoins(studentId, -amount);
    });
  }, [studentsSlice, gamificationSlice]);

  const handleSelectStudentLogin = useCallback((studentOrId: string | Student) => {
    if (typeof studentOrId === 'string') {
      const found = studentsSlice.students.find((s) => s.id === studentOrId);
      if (found) {
        auth.selectStudentLogin(found);
      }
    } else {
      auth.selectStudentLogin(studentOrId);
    }
  }, [studentsSlice.students, auth]);

  const exportClassroomDataJSON = useCallback(() => {
    const exportData = {
      version: '5B2-v4',
      exportedAt: new Date().toISOString(),
      students: studentsSlice.students,
      desks: studentsSlice.desks,
      classTasks: tasksSlice.classTasks,
      rewardHistory: gamificationSlice.rewardHistory,
      seatingPlans: studentsSlice.seatingPlans,
      timetableSlots: timetableSlice.timetableSlots,
      timetableSettings: timetableSlice.timetableSettings,
      worksheets: mediaSlice.worksheets,
      gifts: gamificationSlice.gifts,
    };
    return JSON.stringify(exportData, null, 2);
  }, [studentsSlice, tasksSlice, gamificationSlice, timetableSlice, mediaSlice]);

  const importClassroomDataJSON = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.students && Array.isArray(data.students)) studentsSlice.setStudentsDirectly(data.students);
      if (data.desks && Array.isArray(data.desks)) studentsSlice.setDesksDirectly(data.desks);
      if (data.classTasks && Array.isArray(data.classTasks)) tasksSlice.setClassTasksDirectly(data.classTasks);
      if (data.rewardHistory && Array.isArray(data.rewardHistory)) gamificationSlice.setRewardHistoryDirectly(data.rewardHistory);
      if (data.seatingPlans && Array.isArray(data.seatingPlans)) studentsSlice.setSeatingPlansDirectly(data.seatingPlans);
      if (data.timetableSlots && Array.isArray(data.timetableSlots)) timetableSlice.setTimetableSlotsDirectly(data.timetableSlots);
      if (data.timetableSettings) timetableSlice.setTimetableSettingsDirectly(data.timetableSettings);
      sounds.playCorrect();
      return true;
    } catch {
      return false;
    }
  }, [studentsSlice, tasksSlice, gamificationSlice, timetableSlice]);

  const resetAllData = useCallback(() => {
    timetableSlice.resetTimetable();
    sounds.playCorrect();
  }, [timetableSlice]);

  const unifiedValue = useMemo<ClassroomContextType>(() => ({
    // Auth slice
    role: auth.role,
    setRole: auth.setRole,
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    isAdminLoggedIn: auth.isAdminLoggedIn,
    currentStudent: auth.currentStudent,
    setCurrentStudent: auth.setCurrentStudent,
    isTeacherLoggedIn: auth.isTeacherLoggedIn,
    setIsTeacherLoggedIn: auth.setIsTeacherLoggedIn,
    activeParentStudentId: auth.activeParentStudentId,
    setActiveParentStudentId: auth.setActiveParentStudentId,
    loginAsTeacherOrAdmin: auth.loginAsTeacherOrAdmin,
    loginAsTeacherWithGoogle: auth.loginAsTeacherWithGoogle,
    loginAsStudent: auth.loginAsStudent,
    loginAsParent: auth.loginAsParent,
    logout: auth.logout,
    switchAccount: auth.switchAccount,
    selectStudentLogin: handleSelectStudentLogin,
    logoutStudent: auth.logoutStudent,
    verifyTeacherPin: auth.verifyTeacherPin,
    changeTeacherPin: auth.changeTeacherPin,
    logoutTeacher: auth.logoutTeacher,
    isDefaultPin: auth.isDefaultPin,

    // Students slice
    students: studentsSlice.students,
    desks: studentsSlice.desks,
    awardCoins: studentsSlice.awardCoins,
    updateDeskStudent: studentsSlice.updateDeskStudent,
    swapDeskStudents: studentsSlice.swapDeskStudents,
    importRealStudents: studentsSlice.importRealStudents,
    supabase,
    addStudent: studentsSlice.addStudent,
    bulkImportStudents: studentsSlice.bulkImportStudents,
    updateStudent: studentsSlice.updateStudent,
    deleteStudent: studentsSlice.deleteStudent,
    updateStudentAvatar: studentsSlice.updateStudentAvatar,
    seatingPlans: studentsSlice.seatingPlans,
    saveSeatingPlan: studentsSlice.saveSeatingPlan,
    applySeatingPlan: studentsSlice.applySeatingPlan,
    deleteSeatingPlan: studentsSlice.deleteSeatingPlan,

    // Tasks slice
    classTasks: tasksSlice.classTasks,
    addClassTask: tasksSlice.addClassTask,
    updateClassTask: tasksSlice.updateClassTask,
    deleteClassTask: tasksSlice.deleteClassTask,
    updateStudentTaskStatus: tasksSlice.updateStudentTaskStatus,
    bulkUpdateStudentTaskStatus: tasksSlice.bulkUpdateStudentTaskStatus,
    submitStudentTaskAnswers: tasksSlice.submitStudentTaskAnswers,
    verifySelfDeclaredTask: tasksSlice.verifySelfDeclaredTask,

    // Gamification slice
    gifts: gamificationSlice.gifts,
    redemptions: gamificationSlice.redemptions,
    rewardHistory: gamificationSlice.rewardHistory,
    studentUnlockedSupplies: gamificationSlice.studentUnlockedSupplies,
    redeemGift: handleRedeemGift,
    deliverGift: gamificationSlice.deliverGift,
    addGift: gamificationSlice.addGift,
    updateGift: gamificationSlice.updateGift,
    recordReward: gamificationSlice.recordReward,
    revokeReward: gamificationSlice.revokeReward,
    unlockSchoolSupply: handleUnlockSchoolSupply,

    // Timetable slice
    timetableSubjects: timetableSlice.timetableSubjects,
    timetableSlots: timetableSlice.timetableSlots,
    timetableSettings: timetableSlice.timetableSettings,
    updateTimetableSettings: timetableSlice.updateTimetableSettings,
    toggleSubjectVisibility: timetableSlice.toggleSubjectVisibility,
    setOnlyCoreSubjects: timetableSlice.setOnlyCoreSubjects,
    updateTimetableSlot: timetableSlice.updateTimetableSlot,
    bulkUpdateTimetableSlots: timetableSlice.bulkUpdateTimetableSlots,
    resetTimetable: timetableSlice.resetTimetable,

    // Media slice
    worksheets: mediaSlice.worksheets,
    submissions: mediaSlice.submissions,
    callHistory: mediaSlice.callHistory,
    aiVideos: mediaSlice.aiVideos,
    mediaUploads: mediaSlice.mediaUploads,
    addWorksheet: mediaSlice.addWorksheet,
    deleteWorksheet: mediaSlice.deleteWorksheet,
    submitWorksheetResult: mediaSlice.submitWorksheetResult,
    addAIVideo: mediaSlice.addAIVideo,
    deleteAIVideo: mediaSlice.deleteAIVideo,
    updateAIVideo: mediaSlice.updateAIVideo,
    addMediaUpload: mediaSlice.addMediaUpload,
    deleteMediaUpload: mediaSlice.deleteMediaUpload,
    recordCallHistory: mediaSlice.recordCallHistory,

    // Export/import
    exportClassroomDataJSON,
    importClassroomDataJSON,
    resetAllData,
  }), [
    auth,
    studentsSlice,
    tasksSlice,
    gamificationSlice,
    timetableSlice,
    mediaSlice,
    handleSelectStudentLogin,
    handleRedeemGift,
    handleUnlockSchoolSupply,
    exportClassroomDataJSON,
    importClassroomDataJSON,
    resetAllData,
  ]);

  return (
    <ClassroomUnifiedContext.Provider value={unifiedValue}>
      {children}
    </ClassroomUnifiedContext.Provider>
  );
};

/**
 * Top-level ClassroomProvider that mounts all domain providers in a clean,
 * decoupled hierarchy, preventing cascading re-renders.
 */
export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <StudentProvider>
        <TaskProvider>
          <GamificationProvider>
            <TimetableProvider>
              <MediaProvider>
                <ClassroomBridge>{children}</ClassroomBridge>
              </MediaProvider>
            </TimetableProvider>
          </GamificationProvider>
        </TaskProvider>
      </StudentProvider>
    </AuthProvider>
  );
};

/**
 * Backward-compatible facade hook.
 * Existing components using useClassroom() continue to function without any changes,
 * while new/optimized components can use granular hooks (useAuth, useTasks, useTimetable, etc.)
 */
export const useClassroom = (): ClassroomContextType => {
  const context = useContext(ClassroomUnifiedContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
