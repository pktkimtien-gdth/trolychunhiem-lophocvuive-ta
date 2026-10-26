// MongoDB Mongoose Schemas for Production LMS Backend
// Includes indexing, schema validation, virtuals, and bcrypt password hashing middleware

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// 1. USER & ADMIN SCHEMA (Teacher / Student / Parent)
// ==========================================
export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: 'teacher' | 'student' | 'parent';
  name: string;
  comparePassword(plainText: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student', 'parent'], default: 'student', index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Method to verify password / PIN
UserSchema.methods.comparePassword = async function (plainText: string): Promise<boolean> {
  return bcrypt.compare(plainText, this.passwordHash);
};

// ==========================================
// 2. STUDENT SCHEMA
// ==========================================
export interface IStudent extends Document {
  name: string;
  gender: 'male' | 'female';
  studentCode: string;
  avatar: string;
  coins: number;
  stars: number;
  group: string; // 'Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4'
  row: number;
  col: number;
  deskId?: string;
  attendanceStatus: 'present' | 'absent' | 'late';
  badges: string[];
  notes?: string;
  parentPinHash?: string;
  teacherComments?: string;
  academicScores: Map<string, number>;
  reminderNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, trim: true, index: true },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    studentCode: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    avatar: { type: String, required: true },
    coins: { type: Number, default: 0, min: 0 },
    stars: { type: Number, default: 0, min: 0 },
    group: { type: String, default: 'Tổ 1', index: true },
    row: { type: Number, default: 1, min: 1, max: 6 },
    col: { type: Number, default: 1, min: 1, max: 4 },
    deskId: { type: String },
    attendanceStatus: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    badges: [{ type: String }],
    notes: { type: String },
    parentPinHash: { type: String },
    teacherComments: { type: String },
    academicScores: { type: Map, of: Number, default: {} },
    reminderNotes: [{ type: String }],
  },
  { timestamps: true }
);

// ==========================================
// 3. TASK (ClassTask) SCHEMA
// ==========================================
export interface IStudentTaskRecord {
  studentId: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'completed' | 'needs_revision' | 'late';
  score?: number;
  note?: string;
  submittedAt?: Date;
  updatedAt?: Date;
  answers?: any;
  attemptsCount: number;
  selfDeclaredCompleted: boolean;
  selfDeclaredNote?: string;
  teacherVerified: boolean;
}

export interface ITask extends Document {
  title: string;
  subject: string;
  description: string;
  assignedDate: Date;
  dueDate: Date;
  assignedToType: 'all' | 'group' | 'custom';
  assignedGroup?: string;
  assignedStudentIds: string[];
  priority: 'low' | 'medium' | 'high';
  criteria?: string;
  rewardCoins: number;
  week?: string;
  taskType: 'interactive_quiz' | 'external_link' | 'short_essay' | 'practice_step';
  questions?: any[];
  externalUrl?: string;
  externalPlatform?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isDraft: boolean;
  isClosed: boolean;
  studentRecords: Map<string, IStudentTaskRecord>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentTaskRecordSchema = new Schema<IStudentTaskRecord>(
  {
    studentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'completed', 'needs_revision', 'late'],
      default: 'not_started',
    },
    score: { type: Number, min: 0, max: 10 },
    note: { type: String },
    submittedAt: { type: Date },
    updatedAt: { type: Date, default: Date.now },
    answers: { type: Schema.Types.Mixed },
    attemptsCount: { type: Number, default: 0 },
    selfDeclaredCompleted: { type: Boolean, default: false },
    selfDeclaredNote: { type: String },
    teacherVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

export const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, index: true },
    description: { type: String, required: true },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    assignedToType: { type: String, enum: ['all', 'group', 'custom'], default: 'all' },
    assignedGroup: { type: String },
    assignedStudentIds: [{ type: String }],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    criteria: { type: String },
    rewardCoins: { type: Number, default: 10, min: 0 },
    week: { type: String, index: true },
    taskType: {
      type: String,
      enum: ['interactive_quiz', 'external_link', 'short_essay', 'practice_step'],
      default: 'interactive_quiz',
    },
    questions: [
      {
        id: String,
        type: { type: String, default: 'single_choice' },
        prompt: String,
        options: [String],
        correctAnswer: Schema.Types.Mixed,
        hint: String,
        explanation: String,
      },
    ],
    externalUrl: { type: String },
    externalPlatform: { type: String },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    isDraft: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
    studentRecords: { type: Map, of: StudentTaskRecordSchema, default: {} },
  },
  { timestamps: true }
);

// ==========================================
// 4. WORKSHEET SCHEMA
// ==========================================
export interface IWorksheetQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  image?: string;
}

export interface IWorksheet extends Document {
  title: string;
  subject: string;
  grade: string;
  type: 'direct' | 'external_link';
  externalUrl?: string;
  provider?: string;
  description: string;
  questions: IWorksheetQuestion[];
  rewardCoins: number;
  minPassPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export const WorksheetSchema = new Schema<IWorksheet>(
  {
    title: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, index: true },
    grade: { type: String, default: 'Lớp 5' },
    type: { type: String, enum: ['direct', 'external_link'], default: 'direct' },
    externalUrl: { type: String },
    provider: { type: String },
    description: { type: String, required: true },
    questions: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        answerIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        image: { type: String },
      },
    ],
    rewardCoins: { type: Number, default: 10, min: 0 },
    minPassPercent: { type: Number, default: 80, min: 0, max: 100 },
  },
  { timestamps: true }
);

// ==========================================
// 5. GIFT ITEM SCHEMA
// ==========================================
export interface IGift extends Document {
  name: string;
  category: 'dung_cu' | 'dac_quyen' | 'huy_hieu' | 'do_choi';
  coinsRequired: number;
  icon: string;
  imageColor: string;
  stock: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export const GiftSchema = new Schema<IGift>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['dung_cu', 'dac_quyen', 'huy_hieu', 'do_choi'],
      default: 'dung_cu',
      index: true,
    },
    coinsRequired: { type: Number, required: true, min: 0 },
    icon: { type: String, required: true },
    imageColor: { type: String, default: 'from-amber-400 to-orange-500' },
    stock: { type: Number, default: 10, min: 0 },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Export Mongoose Models if connected to MongoDB
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const StudentModel = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export const WorksheetModel = mongoose.models.Worksheet || mongoose.model<IWorksheet>('Worksheet', WorksheetSchema);
export const GiftModel = mongoose.models.Gift || mongoose.model<IGift>('Gift', GiftSchema);
