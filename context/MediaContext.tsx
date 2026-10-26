import React, { createContext, useContext, useCallback, useMemo } from 'react';
import {
  Worksheet,
  Submission,
  CallHistoryItem,
  AIVideoItem,
  MediaUploadItem,
} from '../types';
import {
  INITIAL_WORKSHEETS,
  INITIAL_AI_VIDEOS,
  INITIAL_MEDIA_UPLOADS,
} from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';
import { generateUUID } from '../utils/uuid';

export interface MediaContextType {
  worksheets: Worksheet[];
  submissions: Submission[];
  callHistory: CallHistoryItem[];
  aiVideos: AIVideoItem[];
  mediaUploads: MediaUploadItem[];
  addWorksheet: (ws: Worksheet) => void;
  deleteWorksheet: (id: string) => void;
  submitWorksheetResult: (
    worksheet: Worksheet,
    answers: Record<string, number>,
    score: number,
    total: number
  ) => { isPassed: boolean; coinsAwarded: number; percent: number };
  addAIVideo: (video: Omit<AIVideoItem, 'id' | 'createdAt'>) => void;
  deleteAIVideo: (id: string) => void;
  updateAIVideo: (video: AIVideoItem) => void;
  addMediaUpload: (item: Omit<MediaUploadItem, 'id' | 'uploadedAt'>) => void;
  deleteMediaUpload: (id: string) => void;
  recordCallHistory: (item: Omit<CallHistoryItem, 'id' | 'timestamp'>) => void;
  setWorksheetsDirectly: (worksheets: Worksheet[]) => void;
}

const MediaContext = createContext<MediaContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worksheets, setWorksheets] = useDebouncedLocalStorage<Worksheet[]>(
    STORAGE_KEY_PREFIX + 'worksheets',
    () => INITIAL_WORKSHEETS
  );

  const [submissions, setSubmissions] = useDebouncedLocalStorage<Submission[]>(
    STORAGE_KEY_PREFIX + 'submissions',
    () => []
  );

  const [callHistory, setCallHistory] = useDebouncedLocalStorage<CallHistoryItem[]>(
    STORAGE_KEY_PREFIX + 'callHistory',
    () => []
  );

  const [aiVideos, setAiVideos] = useDebouncedLocalStorage<AIVideoItem[]>(
    STORAGE_KEY_PREFIX + 'ai_videos',
    () => INITIAL_AI_VIDEOS
  );

  const [mediaUploads, setMediaUploads] = useDebouncedLocalStorage<MediaUploadItem[]>(
    STORAGE_KEY_PREFIX + 'media_uploads',
    () => INITIAL_MEDIA_UPLOADS
  );

  const addWorksheet = useCallback((ws: Worksheet) => {
    setWorksheets((prev) => [ws, ...prev]);
    sounds.playCorrect();
  }, [setWorksheets]);

  const deleteWorksheet = useCallback((id: string) => {
    setWorksheets((prev) => prev.filter((w) => w.id !== id));
    sounds.playCorrect();
  }, [setWorksheets]);

  const submitWorksheetResult = useCallback((
    worksheet: Worksheet,
    answers: Record<string, number>,
    score: number,
    total: number
  ) => {
    const percent = Math.round((score / total) * 100);
    const isPassed = percent >= 80;
    const coinsAwarded = isPassed ? 10 : 2;

    const sub: Submission = {
      id: `sub_${generateUUID()}`,
      worksheetId: worksheet.id,
      worksheetTitle: worksheet.title,
      subject: worksheet.subject,
      studentId: 'current',
      studentName: 'Em',
      answers,
      score,
      totalQuestions: total,
      percent,
      timestamp: new Date().toISOString(),
      isPassed,
      coinsEarned: coinsAwarded,
    };

    setSubmissions((prev) => [sub, ...prev]);
    sounds.playCorrect();

    return { isPassed, coinsAwarded, percent };
  }, [setSubmissions]);

  const addAIVideo = useCallback((videoData: Omit<AIVideoItem, 'id' | 'createdAt'>) => {
    const newVideo: AIVideoItem = {
      ...videoData,
      id: `aivideo_${generateUUID()}`,
      createdAt: new Date().toISOString(),
    };
    setAiVideos((prev) => [newVideo, ...prev]);
    sounds.playCorrect();
  }, [setAiVideos]);

  const deleteAIVideo = useCallback((id: string) => {
    setAiVideos((prev) => prev.filter((v) => v.id !== id));
    sounds.playCorrect();
  }, [setAiVideos]);

  const updateAIVideo = useCallback((updated: AIVideoItem) => {
    setAiVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    sounds.playCorrect();
  }, [setAiVideos]);

  const addMediaUpload = useCallback((itemData: Omit<MediaUploadItem, 'id' | 'uploadedAt'>) => {
    const newItem: MediaUploadItem = {
      ...itemData,
      id: `media_${generateUUID()}`,
      uploadedAt: new Date().toISOString(),
    };
    setMediaUploads((prev) => [newItem, ...prev]);
    sounds.playCorrect();
  }, [setMediaUploads]);

  const deleteMediaUpload = useCallback((id: string) => {
    setMediaUploads((prev) => prev.filter((m) => m.id !== id));
    sounds.playCorrect();
  }, [setMediaUploads]);

  const recordCallHistory = useCallback((itemData: Omit<CallHistoryItem, 'id' | 'timestamp'>) => {
    const item: CallHistoryItem = {
      ...itemData,
      id: `call_${generateUUID()}`,
      timestamp: new Date().toISOString(),
    };
    setCallHistory((prev) => [item, ...prev]);
  }, [setCallHistory]);

  const value = useMemo<MediaContextType>(() => ({
    worksheets,
    submissions,
    callHistory,
    aiVideos,
    mediaUploads,
    addWorksheet,
    deleteWorksheet,
    submitWorksheetResult,
    addAIVideo,
    deleteAIVideo,
    updateAIVideo,
    addMediaUpload,
    deleteMediaUpload,
    recordCallHistory,
    setWorksheetsDirectly: setWorksheets,
  }), [
    worksheets,
    submissions,
    callHistory,
    aiVideos,
    mediaUploads,
    addWorksheet,
    deleteWorksheet,
    submitWorksheetResult,
    addAIVideo,
    deleteAIVideo,
    updateAIVideo,
    addMediaUpload,
    deleteMediaUpload,
    recordCallHistory,
    setWorksheets,
  ]);

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
};

export const useMedia = (): MediaContextType => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};
