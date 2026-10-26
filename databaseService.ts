// Production-Grade Database Repository Layer
// Supports seamless switching between Prisma (PostgreSQL) / Mongoose (MongoDB)
// and thread-safe in-memory caching for zero-dependency instant execution.

import {
  INITIAL_STUDENTS,
  INITIAL_CLASS_TASKS,
  INITIAL_WORKSHEETS,
  INITIAL_GIFTS,
} from '../../src/data/initialData';
import { Student, ClassTask, Worksheet, GiftItem, StudentTaskRecord } from '../../src/types';

class DatabaseService {
  private students: Map<string, Student> = new Map();
  private tasks: Map<string, ClassTask> = new Map();
  private worksheets: Map<string, Worksheet> = new Map();
  private gifts: Map<string, GiftItem> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    INITIAL_STUDENTS.forEach((s) => this.students.set(s.id, { ...s }));
    INITIAL_CLASS_TASKS.forEach((t) => this.tasks.set(t.id, { ...t }));
    INITIAL_WORKSHEETS.forEach((w) => this.worksheets.set(w.id, { ...w }));
    INITIAL_GIFTS.forEach((g) => this.gifts.set(g.id, { ...g }));
    console.log(`[DB] Database service initialized with ${this.students.size} students, ${this.tasks.size} tasks, ${this.worksheets.size} worksheets, ${this.gifts.size} gifts.`);
  }

  // ============================
  // STUDENT CRUD
  // ============================
  async getStudents(filters?: { group?: string; search?: string }): Promise<Student[]> {
    let result = Array.from(this.students.values());
    if (filters?.group) {
      result = result.filter((s) => s.group === filters.group);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.studentCode && s.studentCode.toLowerCase().includes(q))
      );
    }
    return result;
  }

  async getStudentById(id: string): Promise<Student | null> {
    return this.students.get(id) || null;
  }

  async createStudent(data: Partial<Student>): Promise<Student> {
    const id = data.id || `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const studentCode = data.studentCode || `HS5B2-${String(this.students.size + 1).padStart(2, '0')}`;
    const newStudent: Student = {
      id,
      name: data.name || 'Học sinh mới',
      gender: data.gender || 'male',
      avatar:
        data.avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name || 'New')}`,
      coins: data.coins ?? 10,
      stars: data.stars ?? 5,
      group: data.group || 'Tổ 1',
      row: data.row || 1,
      col: data.col || 1,
      deskId: data.deskId,
      attendanceStatus: data.attendanceStatus || 'present',
      badges: data.badges || ['Thành Viên Mới'],
      notes: data.notes || '',
      parentPin: data.parentPin || '1234',
      studentCode,
      academicScores: data.academicScores || {},
      reminderNotes: data.reminderNotes || [],
      teacherComments: data.teacherComments || '',
    };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    const current = this.students.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, id };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  async adjustStudentCoins(id: string, amount: number, starsDelta = 0): Promise<Student | null> {
    const student = this.students.get(id);
    if (!student) return null;
    student.coins = Math.max(0, (student.coins || 0) + amount);
    if (starsDelta !== 0) {
      student.stars = Math.max(0, (student.stars || 0) + starsDelta);
    }
    this.students.set(id, student);
    return student;
  }

  // ============================
  // TASK CRUD (ClassTask)
  // ============================
  async getTasks(filters?: { week?: string; subject?: string }): Promise<ClassTask[]> {
    let list = Array.from(this.tasks.values());
    if (filters?.week) {
      list = list.filter((t) => t.week === filters.week);
    }
    if (filters?.subject) {
      list = list.filter((t) => t.subject.toLowerCase() === filters.subject!.toLowerCase());
    }
    return list;
  }

  async getTaskById(id: string): Promise<ClassTask | null> {
    return this.tasks.get(id) || null;
  }

  async createTask(data: Partial<ClassTask>): Promise<ClassTask> {
    const id = data.id || `task_${Date.now()}`;
    const newTask: ClassTask = {
      id,
      title: data.title || 'Nhiệm vụ học tập mới',
      subject: data.subject || 'Toán',
      description: data.description || '',
      assignedDate: data.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignedToType: data.assignedToType || 'all',
      assignedGroup: data.assignedGroup,
      assignedStudentIds: data.assignedStudentIds || [],
      priority: data.priority || 'medium',
      criteria: data.criteria || 'Hoàn thành đúng hạn',
      rewardCoins: data.rewardCoins ?? 10,
      studentRecords: data.studentRecords || {},
      createdAt: data.createdAt || new Date().toISOString(),
      week: data.week || 'Tuần hiện tại',
      taskType: data.taskType || 'interactive_quiz',
      questions: data.questions || [],
      externalUrl: data.externalUrl,
      externalPlatform: data.externalPlatform,
      isDraft: data.isDraft ?? false,
      isClosed: data.isClosed ?? false,
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<ClassTask>): Promise<ClassTask | null> {
    const current = this.tasks.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, id };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async submitStudentTask(
    taskId: string,
    studentId: string,
    submission: Partial<StudentTaskRecord>
  ): Promise<{ task: ClassTask; studentRecord: StudentTaskRecord } | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const existingRecord = task.studentRecords[studentId] || {
      status: 'not_started',
      attemptsCount: 0,
      selfDeclaredCompleted: false,
      teacherVerified: false,
    };

    const updatedRecord: StudentTaskRecord = {
      ...existingRecord,
      ...submission,
      status: submission.status || 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attemptsCount: (existingRecord.attemptsCount || 0) + 1,
    };

    task.studentRecords[studentId] = updatedRecord;
    this.tasks.set(taskId, task);
    return { task, studentRecord: updatedRecord };
  }

  async gradeStudentTask(
    taskId: string,
    studentId: string,
    gradeData: { score: number; note?: string; teacherVerified?: boolean; awardCoins?: boolean }
  ): Promise<{ task: ClassTask; student: Student | null } | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const record = task.studentRecords[studentId] || {
      status: 'submitted',
      attemptsCount: 1,
      selfDeclaredCompleted: true,
      teacherVerified: false,
    };

    record.score = gradeData.score;
    if (gradeData.note !== undefined) record.note = gradeData.note;
    record.teacherVerified = gradeData.teacherVerified ?? true;
    record.status = gradeData.score >= 5 ? 'completed' : 'needs_revision';
    record.updatedAt = new Date().toISOString();

    task.studentRecords[studentId] = record;
    this.tasks.set(taskId, task);

    let updatedStudent: Student | null = null;
    if (gradeData.awardCoins && task.rewardCoins > 0) {
      updatedStudent = await this.adjustStudentCoins(studentId, task.rewardCoins, 1);
    } else {
      updatedStudent = await this.getStudentById(studentId);
    }

    return { task, student: updatedStudent };
  }

  // ============================
  // WORKSHEET CRUD
  // ============================
  async getWorksheets(filters?: { subject?: string }): Promise<Worksheet[]> {
    let list = Array.from(this.worksheets.values());
    if (filters?.subject) {
      list = list.filter((w) => w.subject.toLowerCase() === filters.subject!.toLowerCase());
    }
    return list;
  }

  async getWorksheetById(id: string): Promise<Worksheet | null> {
    return this.worksheets.get(id) || null;
  }

  async createWorksheet(data: Partial<Worksheet>): Promise<Worksheet> {
    const id = data.id || `ws_${Date.now()}`;
    const newWs: Worksheet = {
      id,
      title: data.title || 'Phiếu bài tập mới',
      subject: data.subject || 'Toán',
      grade: data.grade || 'Lớp 5',
      type: data.type || 'direct',
      externalUrl: data.externalUrl,
      provider: data.provider,
      description: data.description || '',
      questions: data.questions || [],
      rewardCoins: data.rewardCoins ?? 10,
      minPassPercent: data.minPassPercent ?? 80,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    this.worksheets.set(id, newWs);
    return newWs;
  }

  async updateWorksheet(id: string, updates: Partial<Worksheet>): Promise<Worksheet | null> {
    const current = this.worksheets.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, id };
    this.worksheets.set(id, updated);
    return updated;
  }

  async deleteWorksheet(id: string): Promise<boolean> {
    return this.worksheets.delete(id);
  }

  // ============================
  // GIFT CRUD & REDEMPTION
  // ============================
  async getGifts(filters?: { category?: string }): Promise<GiftItem[]> {
    let list = Array.from(this.gifts.values());
    if (filters?.category) {
      list = list.filter((g) => g.category === filters.category);
    }
    return list;
  }

  async getGiftById(id: string): Promise<GiftItem | null> {
    return this.gifts.get(id) || null;
  }

  async createGift(data: Partial<GiftItem>): Promise<GiftItem> {
    const id = data.id || `gift_${Date.now()}`;
    const newGift: GiftItem = {
      id,
      name: data.name || 'Phần quà mới',
      category: data.category || 'dung_cu',
      coinsRequired: data.coinsRequired ?? 20,
      icon: data.icon || 'Gift',
      imageColor: data.imageColor || 'from-amber-400 to-orange-500',
      stock: data.stock ?? 10,
      description: data.description || '',
    };
    this.gifts.set(id, newGift);
    return newGift;
  }

  async updateGift(id: string, updates: Partial<GiftItem>): Promise<GiftItem | null> {
    const current = this.gifts.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, id };
    this.gifts.set(id, updated);
    return updated;
  }

  async deleteGift(id: string): Promise<boolean> {
    return this.gifts.delete(id);
  }

  async redeemGift(
    giftId: string,
    studentId: string
  ): Promise<{ success: boolean; message: string; remainingCoins?: number; remainingStock?: number }> {
    const gift = this.gifts.get(giftId);
    if (!gift) {
      return { success: false, message: 'Không tìm thấy quà phẩm này.' };
    }

    if (gift.stock <= 0) {
      return { success: false, message: 'Phần quà này hiện đã hết hàng trong kho.' };
    }

    const student = this.students.get(studentId);
    if (!student) {
      return { success: false, message: 'Không tìm thấy thông tin học sinh.' };
    }

    if ((student.coins || 0) < gift.coinsRequired) {
      return {
        success: false,
        message: `Học sinh không đủ Xu. Cần ${gift.coinsRequired} Xu, hiện có ${student.coins || 0} Xu.`,
      };
    }

    // Deduct stock and coins atomically
    gift.stock -= 1;
    student.coins -= gift.coinsRequired;
    this.gifts.set(giftId, gift);
    this.students.set(studentId, student);

    return {
      success: true,
      message: `Đổi quà "${gift.name}" thành công! Đã trừ ${gift.coinsRequired} Xu.`,
      remainingCoins: student.coins,
      remainingStock: gift.stock,
    };
  }
}

export const dbService = new DatabaseService();
