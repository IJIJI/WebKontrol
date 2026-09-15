import { useMemo, useSyncExternalStore } from "react";

import { isBlock, type BlockLike } from "./blockUtils";

/**
 * The copied block, held in localStorage rather than in a module variable.
 *
 * A variable would be per tab, so copying in one tab and then in another would leave the first
 * tab pasting its own older block while confidently naming it: silently pasting the wrong thing
 * is worse than not offering to paste at all. localStorage is shared across tabs of the origin,
 * synchronous, survives a reload, and needs no permission, unlike reading the system clipboard.
 *
 * Sharing a block outside the app (writing the JSON to the system clipboard, and accepting one
 * from elsewhere via a paste event) is a later phase; nothing here forecloses it.
 */
const KEY = "webkontrol.blockClipboard";
// `storage` only fires in *other* tabs, so the writing tab has to announce its own change.
const LOCAL_EVENT = "webkontrol:blockClipboard";

/** Put a block on the clipboard. A copy is a snapshot, so the tree it came from can change freely. */
export function writeBlockClipboard(block: BlockLike): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(block));
  } catch {
    return; // private mode or quota: the copy just doesn't stick, nothing else breaks
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

function snapshot(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  // `key` is null when another tab cleared storage wholesale.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

/**
 * The block currently on the clipboard, or undefined when it holds nothing usable. Re-reads when
 * any tab copies, so a picker left open names whatever was copied most recently.
 */
export function useBlockClipboard(): BlockLike | undefined {
  // The snapshot is the raw string, not a parsed object: it has to be referentially stable
  // between renders or React would loop.
  const raw = useSyncExternalStore(subscribe, snapshot);
  return useMemo(() => readBlock(raw), [raw]);
}

function readBlock(raw: string | null): BlockLike | undefined {
  if (raw === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    // Unregistered types are deliberately allowed through: they resolve to the visible broken
    // block, which is a better outcome than refusing a paste for a plugin that isn't loaded.
    return isBlock(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
