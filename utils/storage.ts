/**
 * High-Performance Debounced LocalStorage Engine
 * Solves the main-thread freeze caused by synchronous JSON.stringify
 * on large state objects during rapid state transitions.
 */

type SaveCallback = () => void;

class StorageQueue {
  private queue: Map<string, { value: any; timer: any }> = new Map();
  private debounceMs: number;

  constructor(debounceMs: number = 300) {
    this.debounceMs = debounceMs;
  }

  /**
   * Schedules a debounced write to localStorage.
   * If requestIdleCallback is supported, it executes during browser idle time.
   */
  public setItemDebounced(key: string, value: any, immediate: boolean = false): void {
    if (this.queue.has(key)) {
      clearTimeout(this.queue.get(key)!.timer);
    }

    const executeWrite = () => {
      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        this.queue.delete(key);
      } catch (err) {
        console.error(`[StorageQueue] Failed to persist key "${key}":`, err);
      }
    };

    if (immediate) {
      executeWrite();
      return;
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => executeWrite(), { timeout: 1000 });
      } else {
        executeWrite();
      }
    }, this.debounceMs);

    this.queue.set(key, { value, timer });
  }

  /**
   * Safely reads and parses data from localStorage.
   */
  public getItemSafe<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      return JSON.parse(saved) as T;
    } catch (err) {
      console.warn(`[StorageQueue] Read error on key "${key}", using fallback:`, err);
      return fallback;
    }
  }

  /**
   * Flushes all pending writes immediately (e.g. before unload).
   */
  public flush(): void {
    this.queue.forEach(({ value, timer }, key) => {
      clearTimeout(timer);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error(`[StorageQueue] Error flushing key "${key}":`, err);
      }
    });
    this.queue.clear();
  }
}

export const storageQueue = new StorageQueue(400);

// Flush queue before page unload to guarantee zero data loss
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    storageQueue.flush();
  });
}
