import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { ClassTask, TaskStudentStatus } from '../types';
import { INITIAL_CLASS_TASKS } from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';
import { generateUUID } from '../utils/uuid';

export interface TaskContextType {
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
  bulkUpdateStudentTaskStatus: (
    taskId: string,
    studentIds: string[],
    status: TaskStudentStatus
  ) => void;
  submitStudentTaskAnswers: (
    taskId: string,
    studentId: string,
    answers: Record<string, any>,
    selfDeclared?: boolean,
    selfDeclaredNote?: string
  ) => void;
  verifySelfDeclaredTask: (taskId: string, studentId: string, verified: boolean) => void;
  setClassTasksDirectly: (tasks: ClassTask[]) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classTasks, setClassTasks] = useDebouncedLocalStorage<ClassTask[]>(
    STORAGE_KEY_PREFIX + 'class_tasks',
    () => INITIAL_CLASS_TASKS
  );

  const addClassTask = useCallback((taskData: Omit<ClassTask, 'id' | 'createdAt'>) => {
    const newTask: ClassTask = {
      ...taskData,
      id: `task_${generateUUID()}`,
      createdAt: new Date().toISOString(),
    };
    setClassTasks((prev) => [newTask, ...prev]);
    sounds.playCorrect();
  }, [setClassTasks]);

  const updateClassTask = useCallback((updated: ClassTask) => {
    setClassTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    sounds.playCorrect();
  }, [setClassTasks]);

  const deleteClassTask = useCallback((taskId: string) => {
    setClassTasks((prev) => prev.filter((t) => t.id !== taskId));
    sounds.playCorrect();
  }, [setClassTasks]);

  const updateStudentTaskStatus = useCallback((
    taskId: string,
    studentId: string,
    status: TaskStudentStatus,
    note?: string,
    score?: number
  ) => {
    setClassTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const prevRecord = t.studentRecords[studentId] || { status: 'not_started' };
          const updatedRecord = {
            ...prevRecord,
            status,
            note: note !== undefined ? note : prevRecord.note,
            score: score !== undefined ? score : prevRecord.score,
            updatedAt: new Date().toISOString(),
          };
          return {
            ...t,
            studentRecords: {
              ...t.studentRecords,
              [studentId]: updatedRecord,
            },
          };
        }
        return t;
      })
    );
    sounds.playCorrect();
  }, [setClassTasks]);

  const bulkUpdateStudentTaskStatus = useCallback((
    taskId: string,
    studentIds: string[],
    status: TaskStudentStatus
  ) => {
    setClassTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextRecords = { ...t.studentRecords };
          const nowStr = new Date().toISOString();
          studentIds.forEach((sId) => {
            const prevR = nextRecords[sId] || { status: 'not_started' };
            nextRecords[sId] = {
              ...prevR,
              status,
              updatedAt: nowStr,
            };
          });
          return {
            ...t,
            studentRecords: nextRecords,
          };
        }
        return t;
      })
    );
    sounds.playCorrect();
  }, [setClassTasks]);

  const submitStudentTaskAnswers = useCallback((
    taskId: string,
    studentId: string,
    answers: Record<string, any>,
    selfDeclared: boolean = false,
    selfDeclaredNote?: string
  ) => {
    setClassTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const prevRecord = t.studentRecords[studentId] || { status: 'not_started' };
          const attempts = (prevRecord.attemptsCount || 0) + 1;
          const updatedRecord = {
            ...prevRecord,
            status: 'submitted' as TaskStudentStatus,
            answers,
            attemptsCount: attempts,
            submittedAt: new Date().toISOString(),
            selfDeclaredCompleted: selfDeclared,
            selfDeclaredNote,
          };
          return {
            ...t,
            studentRecords: {
              ...t.studentRecords,
              [studentId]: updatedRecord,
            },
          };
        }
        return t;
      })
    );
    sounds.playCorrect();
  }, [setClassTasks]);

  const verifySelfDeclaredTask = useCallback((taskId: string, studentId: string, verified: boolean) => {
    setClassTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const prevRecord = t.studentRecords[studentId] || { status: 'not_started' };
          const updatedRecord = {
            ...prevRecord,
            teacherVerified: verified,
            status: (verified ? 'completed' : 'needs_revision') as TaskStudentStatus,
            updatedAt: new Date().toISOString(),
          };
          return {
            ...t,
            studentRecords: {
              ...t.studentRecords,
              [studentId]: updatedRecord,
            },
          };
        }
        return t;
      })
    );
    sounds.playCorrect();
  }, [setClassTasks]);

  const value = useMemo<TaskContextType>(() => ({
    classTasks,
    addClassTask,
    updateClassTask,
    deleteClassTask,
    updateStudentTaskStatus,
    bulkUpdateStudentTaskStatus,
    submitStudentTaskAnswers,
    verifySelfDeclaredTask,
    setClassTasksDirectly: setClassTasks,
  }), [
    classTasks,
    addClassTask,
    updateClassTask,
    deleteClassTask,
    updateStudentTaskStatus,
    bulkUpdateStudentTaskStatus,
    submitStudentTaskAnswers,
    verifySelfDeclaredTask,
    setClassTasks,
  ]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
