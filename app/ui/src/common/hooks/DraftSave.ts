import { useMemo, useState } from "react";


// Everything a save bar needs: whether there are edits, how to throw them away, how to commit
// them. A single draft and an aggregate of several both satisfy this, so they're interchangeable.
export interface Savable {
  anyChanged: boolean;
  revertAll: () => void;
  save: SaveFn;
}

export interface Draft<T extends Record<string, unknown>> extends Savable {
  saved: T;
  patch: Partial<T>;
  values: T;

  // `| undefined` even for required fields: an editor must be able to clear an input, and the
  // patch (a Partial<T>) can already hold that. Save-time validation is what reports a
  // required field left empty; storing NaN or a stale value to keep the type happy would not.
  setField: <U extends keyof T>(key: U, value: T[U] | undefined) => void;
  revertField: (key: keyof T) => void;
  isChanged: (key: keyof T) => boolean;
}

// Runs a save and clears the draft only once it resolves, so a failed save leaves the edits in
// place to retry. The rejection is logged but not rethrown: the api layer has already toasted it,
// and rethrowing would only surface as an unhandled rejection in the SaveBar that invoked this.
export type SaveFn = (fn: () => unknown) => Promise<void>;

async function runSave(fn: () => unknown, revert: () => void): Promise<void> {
  try {
    await fn();
    revert();
  } catch (error) {
    console.error("Save failed; keeping the draft.", error);
  }
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

  const setField = <U extends keyof T>(key: U, value: T[U] | undefined): void => {
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

  const save: SaveFn = (fn) => runSave(fn, revertAll);

  const isChanged = (key: keyof T): boolean => key in patch;
  const anyChanged = Object.keys(patch).length > 0;

  return {
    saved: safeSaved, values, patch,
    setField,
    revertField, revertAll,
    isChanged, anyChanged,
    save,
  }
}

// Treat several drafts as one: dirty if any is, and reverting (whether discarded or after a
// successful save) applies to all of them. The save callback commits them all, usually as a
// Promise.all under a single toast. Returns a Savable, so aggregates compose.
export function aggregateDrafts(drafts: Savable[]): Savable {
  const revertAll = (): void => drafts.forEach((draft) => draft.revertAll());

  return {
    anyChanged: drafts.some((draft) => draft.anyChanged),
    revertAll,
    save: (fn) => runSave(fn, revertAll),
  };
}