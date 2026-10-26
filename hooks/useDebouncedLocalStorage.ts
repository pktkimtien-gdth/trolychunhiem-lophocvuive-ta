import { useState, useCallback, useRef, useEffect } from 'react';
import { storageQueue } from '../utils/storage';

/**
 * Custom hook for optimized local storage synchronization.
 * Combines React state with debounced asynchronous writes.
 */
export function useDebouncedLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (valueOrUpdater: T | ((prev: T) => T), immediate?: boolean) => void] {
  const [state, setState] = useState<T>(() => {
    const fallback = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    return storageQueue.getItemSafe<T>(key, fallback);
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const setDebouncedState = useCallback(
    (valueOrUpdater: T | ((prev: T) => T), immediate: boolean = false) => {
      setState((prev) => {
        const nextValue =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (prev: T) => T)(prev)
            : valueOrUpdater;

        // Schedule debounced disk write
        storageQueue.setItemDebounced(key, nextValue, immediate);
        return nextValue;
      });
    },
    [key]
  );

  return [state, setDebouncedState];
}
