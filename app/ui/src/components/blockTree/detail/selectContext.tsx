import { createContext, useContext, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { type BlockLike } from "../model/blockUtils";

export type BlockSelect = (block: BlockLike) => void;

// Re-selecting a block is constant for the whole pane, so it rides a context rather than being
// threaded through every recursive node.
const SelectContext = createContext<BlockSelect | null>(null);

export function SelectProvider({
  onSelect,
  children,
}: {
  onSelect: BlockSelect;
  children: ReactNode;
}): JSX.Element {
  return <SelectContext.Provider value={onSelect}>{children}</SelectContext.Provider>;
}

export function useSelect(): BlockSelect {
  const select = useContext(SelectContext);
  if (select === null) throw new Error("useSelect must be used within a SelectProvider");
  return select;
}
