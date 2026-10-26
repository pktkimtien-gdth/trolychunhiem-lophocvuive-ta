/**
 * UUID and ID Generator Utility
 * Provides cryptographic UUIDs with fallback for maximum browser and runtime compatibility.
 */

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 version 4 compliant fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generates a unique, stable, prefix-tagged ID for timetable slots.
 */
export const generateSlotId = (dayOfWeek?: number, period?: number): string => {
  const uuid = generateUUID();
  if (dayOfWeek !== undefined && period !== undefined) {
    return `slot-d${dayOfWeek}-p${period}-${uuid}`;
  }
  return `slot-${uuid}`;
};
