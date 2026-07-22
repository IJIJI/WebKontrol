import { ReactNode } from "react";

export enum CollectionLayout {
  LIST = "list",
  GRID = "grid",
  TABLE = "table",
} 


export interface CollectionLayoutProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

export interface CollectionProps<T> extends CollectionLayoutProps<T> {
  layout?: CollectionLayout; // Defaults to list // TODO Add the option for different defaults? -> Not optional?
  title?: ReactNode;
  actions?: ReactNode;
  empty?: ReactNode; // Content for when the list is empty.
}