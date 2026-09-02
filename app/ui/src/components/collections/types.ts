import { type ReactNode } from "react";
import { type To } from "react-router-dom";
import { type Variant, type FillStyle } from "../../common/types/variants";

export enum CollectionLayout {
  LIST = "list",
  GRID = "grid",
  TABLE = "table",
}

export interface ItemAction {
  id: string;
  label: string; // tooltip + aria-label
  icon?: ReactNode;
  onClick: () => void | Promise<void>; // async actions show a spinner in the Button while pending
  variant?: Variant;
  fillStyle?: FillStyle;
  disabled?: boolean;
}

// The shared shape an item resolves to. A layout renders `name` (as a link when `to` is set),
// `chips` (tags / status pills), and `actions` (as buttons). `content` is an escape
// hatch for anything custom that doesn't fit the standard shape.
export interface CollectionItemProps {
  to?: To; // TODO: Handle collection items without a target but with an onClick.
  label?: string; // accessible name for the link (defaults to `name` when it's a string)
  title: ReactNode;
  // `null` means deliberately no icon (compact picker rows); `undefined` falls back to a
  // default glyph. Currently honoured by ListItem.
  icon: ReactNode;
  color: string; // TODO: Better color type?
  chips?: ReactNode; // tag chips / status pills row // TODO: Array?
  actions?: ItemAction[];
  // Picker mode: when `onSelect` is set the item is a selectable button (highlighted when
  // `selected`) instead of a link. Currently honoured by GridItem.
  onSelect?: () => void; // TODO: Select is not needed everywhere. Handle the split.
  selected?: boolean;
  // content?: ReactNode; // TODO: optional custom body, replaces the entire item content
}

export interface CollectionLayoutProps<T> {
  items: T[];
  getKey: (item: T) => string;
  // Returns an item's props; the layout renders the matching item component (ListItem / GridItem),
  // so switching layout doesn't require the consumer to change how items are built.
  renderItem: (item: T) => CollectionItemProps;
}

export interface CollectionProps<T> extends CollectionLayoutProps<T> {
  layout?: CollectionLayout; // Defaults to list
  title?: ReactNode;
  actions?: ItemAction[]; // toolbar actions (declarative, like item actions)
  empty?: ReactNode; // Content for when the list is empty.
}
