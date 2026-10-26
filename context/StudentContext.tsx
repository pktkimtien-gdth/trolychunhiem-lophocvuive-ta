import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { Student, DeskPosition, SeatingPlan } from '../types';
import { INITIAL_STUDENTS, INITIAL_DESKS, INITIAL_SEATING_PLANS } from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';
import { getStudentNeutralAvatar, sanitizeStudentAvatar, isLegacyGenderedAvatar } from '../utils/studentAvatar';
import { generateUUID } from '../utils/uuid';

export interface StudentContextType {
  students: Student[];
  desks: DeskPosition[];
  seatingPlans: SeatingPlan[];
  awardCoins: (studentId: string, amount: number, reason?: string) => void;
  updateDeskStudent: (deskId: string, studentId?: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'coins' | 'stars' | 'badges'>) => void;
  bulkImportStudents: (names: string[]) => { count: number };
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  updateStudentAvatar: (studentId: string, avatarUrl: string) => void;
  saveSeatingPlan: (name: string, description?: string) => void;
  applySeatingPlan: (planId: string) => void;
  deleteSeatingPlan: (planId: string) => void;
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
  setStudentsDirectly: (students: Student[]) => void;
  setDesksDirectly: (desks: DeskPosition[]) => void;
  setSeatingPlansDirectly: (plans: SeatingPlan[]) => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawStudents, setStudents] = useDebouncedLocalStorage<Student[]>(
    STORAGE_KEY_PREFIX + 'students',
    () => INITIAL_STUDENTS
  );

  // Đảm bảo 100% học sinh dùng hình minh họa trung tính, thân thiện (hoa, lá, mây, mặt trời, ngôi sao...)
  const students = useMemo(() => {
    return rawStudents.map((s) => {
      const sanitizedAvatar = sanitizeStudentAvatar(s);
      if (sanitizedAvatar !== s.avatar) {
        return { ...s, avatar: sanitizedAvatar };
      }
      return s;
    });
  }, [rawStudents]);

  // Cập nhật lại localStorage nếu phát hiện avatar cũ phân biệt giới tính
  useEffect(() => {
    const hasLegacy = rawStudents.some((s) => isLegacyGenderedAvatar(s.avatar));
    if (hasLegacy) {
      setStudents(students);
    }
  }, [rawStudents, students, setStudents]);

  const [rawDesks, setDesks] = useDebouncedLocalStorage<DeskPosition[]>(
    STORAGE_KEY_PREFIX + 'desks',
    () => INITIAL_DESKS
  );

  // Đảm bảo danh sách chỗ ngồi luôn hợp lệ, không bị crash do dữ liệu cũ trong localStorage
  const desks = useMemo<DeskPosition[]>(() => {
    if (!Array.isArray(rawDesks) || rawDesks.length === 0) {
      return INITIAL_DESKS;
    }
    const hasCorrupted = rawDesks.some((d) => !d || typeof d.row !== 'number' || typeof d.col !== 'number');
    if (hasCorrupted) {
      return INITIAL_DESKS;
    }
    return rawDesks;
  }, [rawDesks]);

  // Tự động khôi phục cấu trúc bàn học chuẩn nếu phát hiện dữ liệu lỗi
  useEffect(() => {
    if (
      !Array.isArray(rawDesks) ||
      rawDesks.length === 0 ||
      rawDesks.some((d) => !d || typeof d.row !== 'number' || typeof d.col !== 'number')
    ) {
      setDesks(INITIAL_DESKS, true);
    }
  }, [rawDesks, setDesks]);

  const [seatingPlans, setSeatingPlans] = useDebouncedLocalStorage<SeatingPlan[]>(
    STORAGE_KEY_PREFIX + 'seating_plans',
    () => INITIAL_SEATING_PLANS
  );

  const awardCoins = useCallback((studentId: string, amount: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newCoins = Math.max(0, s.coins + amount);
          const newStars = amount > 0 ? s.stars + 1 : s.stars;
          return { ...s, coins: newCoins, stars: newStars };
        }
        return s;
      })
    );
    if (amount > 0) {
      sounds.playCoin();
    } else {
      sounds.playWrong();
    }
  }, [setStudents]);

  const updateDeskStudent = useCallback((deskId: string, studentId?: string) => {
    setDesks((prev) =>
      prev.map((d) => {
        if (d.id === deskId) {
          return { ...d, studentId };
        }
        if (studentId && d.studentId === studentId) {
          return { ...d, studentId: undefined };
        }
        return d;
      })
    );
    sounds.playCorrect();
  }, [setDesks]);

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'coins' | 'stars' | 'badges'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `s_${generateUUID()}`,
      avatar: studentData.avatar || getStudentNeutralAvatar(studentData.name),
      coins: 20,
      stars: 5,
      badges: ['Chăm chỉ'],
      studentCode: `HS5B2-${String(Date.now()).slice(-2)}`,
    };
    setStudents((prev) => [...prev, newStudent]);
    sounds.playCorrect();
  }, [setStudents]);

  const bulkImportStudents = useCallback((names: string[]) => {
    const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
    let addedCount = 0;

    setStudents((prev) => {
      const existingNames = new Set(prev.map((s) => s.name.trim().toLowerCase()));
      const uniqueNames = validNames.filter((name) => !existingNames.has(name.toLowerCase()));
      addedCount = uniqueNames.length;

      if (uniqueNames.length === 0) return prev;

      const newStudents: Student[] = uniqueNames.map((name, idx) => ({
        id: `s_import_${generateUUID()}`,
        name,
        avatar: getStudentNeutralAvatar(`import_${name}_${idx}`),
        coins: 20,
        stars: 5,
        badges: ['Học sinh mới'],
        studentCode: `HS5B2-${String(prev.length + idx + 1).padStart(2, '0')}`,
        group: `Tổ ${((prev.length + idx) % 4) + 1}`,
      }));

      return [...prev, ...newStudents];
    });

    sounds.playCorrect();
    return { count: addedCount };
  }, [setStudents]);

  const updateStudent = useCallback((updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    sounds.playCorrect();
  }, [setStudents]);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setDesks((prev) =>
      prev.map((d) => (d.studentId === studentId ? { ...d, studentId: undefined } : d))
    );
    sounds.playCorrect();
  }, [setStudents, setDesks]);

  const updateStudentAvatar = useCallback((studentId: string, avatarUrl: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, avatar: avatarUrl } : s))
    );
    sounds.playCorrect();
  }, [setStudents]);

  const saveSeatingPlan = useCallback((name: string, description?: string) => {
    const plan: SeatingPlan = {
      id: `plan_${Date.now()}`,
      name,
      description: description || 'Sơ đồ phân bố chỗ ngồi tối ưu',
      createdAt: new Date().toISOString(),
      desks: [...desks],
      rowsCount: 6,
      colsCount: 4,
      seatsPerDesk: 2,
      isCurrent: true,
    };
    setSeatingPlans((prev) => [...prev, plan]);
    sounds.playCorrect();
  }, [desks, setSeatingPlans]);

  const applySeatingPlan = useCallback((planId: string) => {
    const plan = seatingPlans.find((p) => p.id === planId);
    if (plan && plan.desks) {
      setDesks(plan.desks);
      sounds.playCorrect();
    }
  }, [seatingPlans, setDesks]);

  const deleteSeatingPlan = useCallback((planId: string) => {
    setSeatingPlans((prev) => prev.filter((p) => p.id !== planId));
    sounds.playCorrect();
  }, [setSeatingPlans]);

  /**
   * ========================================================
   * XỬ LÝ KÉO THẢ (DRAG & DROP) VÀ LƯU VỊ TRÍ CHỖ NGỒI SƠ ĐỒ LỚP
   * - Hoán đổi nguyên tử (atomic swap) giữa 2 chỗ ngồi deskA và deskB
   * - Lưu ngay lập tức vào LocalStorage và state để đảm bảo tải lại trang (reload)
   *   sơ đồ lớp học vẫn giữ nguyên vị trí mới nhất vừa được sắp xếp.
   * ========================================================
   */
  const swapDeskStudents = useCallback((deskAId: string, deskBId: string) => {
    if (!deskAId || !deskBId || deskAId === deskBId) return;

    setDesks((prev) => {
      const deskA = prev.find((d) => d.id === deskAId);
      const deskB = prev.find((d) => d.id === deskBId);
      if (!deskA || !deskB) return prev;

      const studentA = deskA.studentId;
      const studentB = deskB.studentId;

      const nextDesks = prev.map((d) => {
        if (d.id === deskAId) return { ...d, studentId: studentB };
        if (d.id === deskBId) return { ...d, studentId: studentA };
        return d;
      });

      // Lưu trạng thái ngay lập tức vào LocalStorage để đảm bảo reload không bị mất
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'desks', JSON.stringify(nextDesks));
      } catch (err) {
        console.error('Lỗi khi lưu vị trí kéo thả sơ đồ lớp:', err);
      }

      return nextDesks;
    });

    sounds.playCorrect();
  }, [setDesks]);

  /**
   * ========================================================
   * IMPORT DANH SÁCH HỌC SINH THỰC TẾ (TỪ FILE .XLSX / .CSV HOẶC DÁN)
   * - Tuyệt đối không tạo dữ liệu giả / mock data
   * - Hỗ trợ phân bổ đúng Tổ 1, Tổ 2, Tổ 3, Tổ 4
   * - Lưu vào LocalStorage và đồng bộ chỗ ngồi 2 chỗ/bàn trên sơ đồ lớp
   * ========================================================
   */
  const importRealStudents = useCallback((
    newRoster: Array<{
      name: string;
      group?: string;
      studentCode?: string;
      parentPin?: string;
      notes?: string;
    }>,
    mode: 'replace' | 'append' = 'replace'
  ) => {
    if (!newRoster || newRoster.length === 0) return { count: 0 };

    const mappedStudents: Student[] = newRoster.map((item, idx) => ({
      id: `s_${Date.now()}_${idx + 1}`,
      name: item.name.trim(),
      avatar: getStudentNeutralAvatar(item.name.trim()),
      coins: 20,
      stars: 5,
      badges: ['Chăm chỉ'],
      studentCode: item.studentCode?.trim() || `HS5B2-${String(idx + 1).padStart(2, '0')}`,
      group: item.group?.trim() || `Tổ ${(idx % 4) + 1}`,
      parentPin: item.parentPin?.trim() || '1234',
      notes: item.notes?.trim() || '',
      attendanceStatus: 'present',
    }));

    if (mode === 'replace') {
      setStudents(mappedStudents);

      // Tự động phân bổ danh sách học sinh vào 42 vị trí bàn ghế (mỗi bàn 2 chỗ)
      setDesks((prevDesks) => {
        const nextDesks = prevDesks.map((desk, idx) => ({
          ...desk,
          studentId: mappedStudents[idx]?.id || undefined,
        }));
        try {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'desks', JSON.stringify(nextDesks));
          localStorage.setItem(STORAGE_KEY_PREFIX + 'students', JSON.stringify(mappedStudents));
        } catch (e) {
          console.error('Lỗi lưu trữ:', e);
        }
        return nextDesks;
      });
    } else {
      setStudents((prev) => {
        const combined = [...prev, ...mappedStudents];
        try {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'students', JSON.stringify(combined));
        } catch (e) {
          console.error('Lỗi lưu trữ:', e);
        }
        return combined;
      });
    }

    sounds.playCorrect();
    return { count: mappedStudents.length };
  }, [setStudents, setDesks]);

  const value = useMemo<StudentContextType>(() => ({
    students,
    desks,
    seatingPlans,
    awardCoins,
    updateDeskStudent,
    swapDeskStudents,
    importRealStudents,
    addStudent,
    bulkImportStudents,
    updateStudent,
    deleteStudent,
    updateStudentAvatar,
    saveSeatingPlan,
    applySeatingPlan,
    deleteSeatingPlan,
    setStudentsDirectly: setStudents,
    setDesksDirectly: setDesks,
    setSeatingPlansDirectly: setSeatingPlans,
  }), [
    students,
    desks,
    seatingPlans,
    awardCoins,
    updateDeskStudent,
    swapDeskStudents,
    importRealStudents,
    addStudent,
    bulkImportStudents,
    updateStudent,
    deleteStudent,
    updateStudentAvatar,
    saveSeatingPlan,
    applySeatingPlan,
    deleteSeatingPlan,
    setStudents,
    setDesks,
    setSeatingPlans,
  ]);

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};

export const useStudents = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
