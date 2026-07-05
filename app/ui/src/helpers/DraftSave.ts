import { useMemo, useState } from "react";


export interface Draft<T extends Record<string, unknown>> {
  values: T;
  patch: Partial<T>;

  setField: <U extends keyof T>(key: U, value: T[U]) => void;
  revertField: (key: keyof T) => void;
  revertAll: () => void;
  isChanged: (key: keyof T) => boolean;
}

export function useDraft<T extends Record<string, unknown>>(saved: T): Draft<T> {
  const [patch, setPatch] = useState<Partial<T>>({});

  const values = useMemo(() => ({ ...saved, ...patch }), [saved, patch]);

  const setField = <U extends keyof T>(key: U, value: T[U]): void => {
    setPatch((prev) => {
      const next: Partial<T> = { ...prev };
      if (Object.is(saved[key], value)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    })
  }

  const revertField = (key: keyof T): void => {
    setPatch((prev) => {
      const next: Partial<T> = { ...prev };
      delete next[key];
      return next;
    })
  }

  const revertAll = (): void => setPatch({});

  const isChanged = (key: keyof T): boolean => key in patch;

  return {
    values, patch,
    setField, 
    revertField, revertAll,
    isChanged
  }
}
