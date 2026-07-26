import { type ReactNode } from "react";
import { type To } from "react-router-dom";
import { type ButtonStyle, type ButtonType } from "../button/Button";

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
  type?: ButtonType;
  style?: ButtonStyle;
  disabled?: boolean;
}

// The shared shape an item resolves to. A layout renders `name` (as a link when `to` is set),
// `chips` (tags / status pills), and `actions` (as buttons). `content` is an escape
// hatch for anything custom that doesn't fit the standard shape.
export interface CollectionItemProps {
  to?: To;
  label?: string; // accessible name for the link (defaults to `name` when it's a string)
  title: ReactNode;
  icon: ReactNode; 
  color: string; // TODO: Better color type?
  chips?: ReactNode; // tag chips / status pills row // TODO: Array?
  actions?: ItemAction[];
  // content?: ReactNode; // TODO: optional custom body, replaces the entire item content
}

export interface CollectionLayoutProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

export interface CollectionProps<T> extends CollectionLayoutProps<T> {
  layout?: CollectionLayout; // Defaults to list
  title?: ReactNode;
  actions?: ItemAction[]; // toolbar actions (declarative, like item actions)
  empty?: ReactNode; // Content for when the list is empty.
}
