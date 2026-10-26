import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import {
  TimetableSubjectConfig,
  TimetableSlot,
  TimetableAdminSettings,
  TimetableSubjectId,
} from '../types';
import {
  ALL_TIMETABLE_SUBJECTS,
  CORE_TIMETABLE_SUBJECT_IDS,
  INITIAL_TIMETABLE_SLOTS,
  DEFAULT_TIMETABLE_SETTINGS,
} from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';
import { generateSlotId } from '../utils/uuid';

export interface TimetableContextType {
  timetableSubjects: TimetableSubjectConfig[];
  timetableSlots: TimetableSlot[];
  timetableSettings: TimetableAdminSettings;
  updateTimetableSettings: (settings: Partial<TimetableAdminSettings>) => void;
  toggleSubjectVisibility: (subjectId: TimetableSubjectId) => void;
  setOnlyCoreSubjects: (onlyCore: boolean) => void;
  updateTimetableSlot: (slot: TimetableSlot) => void;
  bulkUpdateTimetableSlots: (slots: TimetableSlot[]) => void;
  resetTimetable: () => void;
  setTimetableSlotsDirectly: (slots: TimetableSlot[]) => void;
  setTimetableSettingsDirectly: (settings: TimetableAdminSettings) => void;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

/**
 * Sanitizes and deduplicates timetable slots:
 * 1. Removes redundant duplicate slots occupying the exact same day, session, period, and subject.
 * 2. Assigns cryptographic, stable UUIDs via generateSlotId() to any slot missing an ID or colliding with another ID.
 * 3. Auto-heals legacy duplicate IDs (e.g. from prior bulk imports) persisted in localStorage.
 */
export const sanitizeAndDeduplicateSlots = (slots: TimetableSlot[]): TimetableSlot[] => {
  if (!Array.isArray(slots)) return [];

  const seenIds = new Set<string>();
  const seenPositionKeys = new Set<string>();
  const sanitizedList: TimetableSlot[] = [];

  for (const slot of slots) {
    if (!slot || typeof slot !== 'object') continue;

    // Detect exact duplicate slot (same day, session, period, subject and lesson title)
    const positionKey = `${slot.dayOfWeek}-${slot.session}-${slot.period}-${slot.subjectId}-${(slot.lessonTitle || '').trim()}`;
    if (seenPositionKeys.has(positionKey)) {
      // Drop redundant duplicate to keep timetable grid clean and accurate
      continue;
    }
    seenPositionKeys.add(positionKey);

    let id = slot.id;
    // If ID is missing or duplicate, regenerate a guaranteed collision-proof UUID
    if (!id || seenIds.has(id)) {
      id = generateSlotId(slot.dayOfWeek, slot.period);
    }
    seenIds.add(id);

    sanitizedList.push({
      ...slot,
      id,
    });
  }

  return sanitizedList;
};

// Backward-compatible alias
export const ensureUniqueSlotIds = sanitizeAndDeduplicateSlots;

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawTimetableSlots, setRawTimetableSlots] = useDebouncedLocalStorage<TimetableSlot[]>(
    STORAGE_KEY_PREFIX + 'timetable_slots',
    () => sanitizeAndDeduplicateSlots(INITIAL_TIMETABLE_SLOTS)
  );

  // Guarantee all slots in active state have unique, stable IDs
  const timetableSlots = useMemo(() => sanitizeAndDeduplicateSlots(rawTimetableSlots), [rawTimetableSlots]);

  // Self-heal corrupted or duplicate IDs stored in localStorage from previous sessions
  useEffect(() => {
    if (Array.isArray(rawTimetableSlots) && rawTimetableSlots.length > 0) {
      const sanitized = sanitizeAndDeduplicateSlots(rawTimetableSlots);
      const isLengthDifferent = sanitized.length !== rawTimetableSlots.length;
      const hasIdChanges = sanitized.some((s, idx) => s.id !== rawTimetableSlots[idx]?.id);

      if (isLengthDifferent || hasIdChanges) {
        setRawTimetableSlots(sanitized, true);
      }
    }
  }, [rawTimetableSlots, setRawTimetableSlots]);

  const [timetableSettings, setTimetableSettings] = useDebouncedLocalStorage<TimetableAdminSettings>(
    STORAGE_KEY_PREFIX + 'timetable_settings',
    () => DEFAULT_TIMETABLE_SETTINGS
  );

  const [subjectConfigs, setSubjectConfigs] = useDebouncedLocalStorage<TimetableSubjectConfig[]>(
    STORAGE_KEY_PREFIX + 'timetable_subjects',
    () => ALL_TIMETABLE_SUBJECTS
  );

  const updateTimetableSettings = useCallback((newSettings: Partial<TimetableAdminSettings>) => {
    setTimetableSettings((prev) => ({ ...prev, ...newSettings }));
    sounds.playCorrect();
  }, [setTimetableSettings]);

  const toggleSubjectVisibility = useCallback((subjectId: TimetableSubjectId) => {
    setTimetableSettings((prev) => {
      const exists = prev.visibleSubjectIds.includes(subjectId);
      const nextVisible = exists
        ? prev.visibleSubjectIds.filter((id) => id !== subjectId)
        : [...prev.visibleSubjectIds, subjectId];
      return { ...prev, visibleSubjectIds: nextVisible };
    });
    sounds.playCorrect();
  }, [setTimetableSettings]);

  const setOnlyCoreSubjects = useCallback((onlyCore: boolean) => {
    setTimetableSettings((prev) => ({
      ...prev,
      showOnlyCore: onlyCore,
      visibleSubjectIds: onlyCore
        ? [...CORE_TIMETABLE_SUBJECT_IDS]
        : ALL_TIMETABLE_SUBJECTS.map((s) => s.id),
    }));
    sounds.playCorrect();
  }, [setTimetableSettings]);

  const updateTimetableSlot = useCallback((updatedSlot: TimetableSlot) => {
    setRawTimetableSlots((prev) =>
      ensureUniqueSlotIds(prev.map((slot) => (slot.id === updatedSlot.id ? updatedSlot : slot)))
    );
    sounds.playCorrect();
  }, [setRawTimetableSlots]);

  const bulkUpdateTimetableSlots = useCallback((newSlots: TimetableSlot[]) => {
    setRawTimetableSlots(ensureUniqueSlotIds(newSlots), true);
    sounds.playCorrect();
  }, [setRawTimetableSlots]);

  const setTimetableSlotsDirectly = useCallback((slots: TimetableSlot[]) => {
    setRawTimetableSlots(ensureUniqueSlotIds(slots), true);
  }, [setRawTimetableSlots]);

  const resetTimetable = useCallback(() => {
    setRawTimetableSlots(INITIAL_TIMETABLE_SLOTS, true);
    setTimetableSettings(DEFAULT_TIMETABLE_SETTINGS);
    setSubjectConfigs(ALL_TIMETABLE_SUBJECTS);
    sounds.playCorrect();
  }, [setRawTimetableSlots, setTimetableSettings, setSubjectConfigs]);

  const value = useMemo<TimetableContextType>(() => ({
    timetableSubjects: subjectConfigs,
    timetableSlots,
    timetableSettings,
    updateTimetableSettings,
    toggleSubjectVisibility,
    setOnlyCoreSubjects,
    updateTimetableSlot,
    bulkUpdateTimetableSlots,
    resetTimetable,
    setTimetableSlotsDirectly,
    setTimetableSettingsDirectly: setTimetableSettings,
  }), [
    subjectConfigs,
    timetableSlots,
    timetableSettings,
    updateTimetableSettings,
    toggleSubjectVisibility,
    setOnlyCoreSubjects,
    updateTimetableSlot,
    bulkUpdateTimetableSlots,
    resetTimetable,
    setTimetableSlotsDirectly,
    setTimetableSettings,
  ]);

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
};

export const useTimetable = (): TimetableContextType => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
