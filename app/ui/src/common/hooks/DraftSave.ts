import { useMemo, useState } from "react";


export interface Draft<T extends Record<string, unknown>> {
  saved: T;
  patch: Partial<T>;
  values: T;

  setField: <U extends keyof T>(key: U, value: T[U]) => void;
  revertField: (key: keyof T) => void;
  revertAll: () => void;
  isChanged: (key: keyof T) => boolean;
  anyChanged: () => boolean;
}

// Structural equality, treating an `undefined`-valued key as absent (JSON semantics). Object-valued
// fields (e.g. DisplayName, appearance) are a fresh object on every edit, so reference equality
// (`Object.is`) would always read them as changed; this detects a revert to the saved *content*.
// Order-independent, so a spread that reorders keys isn't mistaken for a change.
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

// `saved` may be undefined while data is still loading, so callers can invoke
// this hook unconditionally (before an early return) without breaking hook order.
export function useDraft<T extends Record<string, unknown>>(saved: T | undefined): Draft<T> {
  const safeSaved = (saved ?? {}) as T;
  const [patch, setPatch] = useState<Partial<T>>({});

  const values = useMemo(() => ({ ...safeSaved, ...patch }), [safeSaved, patch]);

  const setField = <U extends keyof T>(key: U, value: T[U]): void => {
    setPatch((prev) => {
      const next: Partial<T> = { ...prev };
      if (deepEqual(safeSaved[key], value)) {
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
  const anyChanged = () => Object.keys(patch).length > 0;

  return {
    saved: safeSaved, values, patch,
    setField,
    revertField, revertAll,
    isChanged, anyChanged
  }
}

// TODO: Add apply hook in draft and applyAll here?
export function aggregateDrafts<V extends Record<string, Draft<any>>>(
  drafts: V,
): {
  anyChanged: boolean;
  patches: { [W in keyof V]: V[W]["patch"] };
  revertAll: () => void;
} {
  const entries = Object.entries(drafts) as [keyof V, Draft<any>][];

  const anyChanged = entries.some(([, draft]) => draft.anyChanged());
  
  const patches = Object.fromEntries(
    entries.map(([key, draft]) => [key, draft.patch]),
  ) as { [W in keyof V]: V[W]["patch"] };

  const revertAll = (): void => entries.forEach(([, draft]) => draft.revertAll());

  return {anyChanged, patches, revertAll};
}