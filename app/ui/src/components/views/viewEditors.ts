import { type ComponentType } from "react";
import type { ZodObject, ZodRawShape } from "zod";

import {
  type ViewType,
  UrlViewConfigSchema,
  BlockViewConfigSchema,
} from "../../../../src/views/types/schema";
import { type Draft } from "../../common/hooks/DraftSave";
import { VIEW_TYPE_META } from "./viewMeta";

// The draft shape the editor works with: a flat, loosely-typed view config. The mapper reads
// fields by key, so per-type precision lives in each entry's `schema` (used for rendering + save
// validation), not in this alias.
export type ViewEditorValues = Record<string, unknown>;

export interface ViewBodyProps {
  draft: Draft<ViewEditorValues>;
}

// Everything type-specific the ViewEditor needs to edit one view type. Adding a view type is a
// single entry here; the editor page stays type-agnostic.
export interface ViewEditorEntry {
  // Member schema: fed to the generic SchemaSettings mapper AND used to safeParse on save.
  schema: ZodObject<ZodRawShape>;
  // Starting draft for a new view, and the type-specific reset when switching to this type
  // (the page preserves `name` across the switch).
  emptyDraft: ViewEditorValues;
  // Custom body component for this type's fields. Omit to use the generic SchemaSettings mapper
  // (the default for simple, flat field types).
  body?: ComponentType<ViewBodyProps>;
}

export const VIEW_EDITORS: Record<ViewType, ViewEditorEntry> = {
  url: {
    schema: UrlViewConfigSchema,
    emptyDraft: { type: "url", name: {}, url: "" },
  },
  blocks: {
    schema: BlockViewConfigSchema,
    emptyDraft: { type: "blocks", name: {} }, // `root` is supplied by the block editor
    // TODO: give blocks a recursive block-field editor (likely a BlockSetting, not a divorced
    // body). Until then `body` is omitted, so the mapper renders `root` read-only via its fallback.
  },
};

// Options for the type <select>, derived from the registry keys + presentation meta.
export const viewTypeOptions: { label: string; value: ViewType }[] = (
  Object.keys(VIEW_EDITORS) as ViewType[]
).map((type) => ({ label: VIEW_TYPE_META[type].label, value: type }));
