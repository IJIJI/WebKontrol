import { type ComponentType } from "react";
import type { ZodObject, ZodRawShape } from "zod";

import {
  type ViewType,
  UrlViewConfigSchema,
  BlockViewConfigSchema,
} from "../../../../src/views/types/schema";
import { type EntityAppearance } from "../../../../src/common/entityAppearance/schema";
import { type DisplayName } from "../../../../src/types/CommonTypes";
import { type Draft } from "../../common/hooks/DraftSave";
import { VIEW_TYPE_META } from "./viewMeta";
import { BlockViewBody } from "./BlockViewBody";
import { validateBlockTree } from "../blockTree/model/validate";
import { type BlockLike } from "../blockTree/model/blockUtils";

// The draft shape the editor works with: a flat, loosely-typed view config. The mapper reads
// fields by key, so per-type precision lives in each entry's `schema` (used for rendering + save
// validation), not in this alias. Shared base fields the editor binds directly (not through the
// schema mapper) are typed here so their call sites stay cast-free, with their *edit* types
// (`name` is edited as a partial). `loadTimeout` stays loose since the mapper renders it by key.
export type ViewEditorValues = Record<string, unknown> & {
  type?: ViewType;
  name?: Partial<DisplayName>;
  appearance?: EntityAppearance;
};

export interface ViewBodyProps {
  draft: Draft<ViewEditorValues>;
  // Page-injected placeholder overrides (e.g. the runtime loadTimeout default), same as the
  // generic mapper receives, a body delegating to SchemaSettings passes them through.
  placeholders?: Record<string, string>;
}

// Everything type-specific the ViewEditor needs to edit one view type. Adding a view type is a
// single entry here; the editor page stays type-agnostic.
export interface ViewEditorEntry {
  // Member schema: fed to the generic SchemaSettings mapper AND used to safeParse on save.
  schema: ZodObject<ZodRawShape>;
  // Starting draft for a new view. Not re-applied when the type <select> changes: fields of the
  // old type simply stay in the draft (harmless, save safeParses against the new type's schema,
  // which strips them) and the new type's own fields render from their empty state. That also
  // means switching away and back doesn't lose what was typed.
  emptyDraft: ViewEditorValues;
  // Custom body component for this type's fields. Omit to use the generic SchemaSettings mapper
  // (the default for simple, flat field types).
  body?: ComponentType<ViewBodyProps>;
  // Extra validation the member schema can't express, run on save after safeParse. Returns the
  // reasons to refuse; empty means fine. Blocks use it because `root` is a loose envelope, so
  // per-block configs are invisible to the view schema.
  validate?: (values: ViewEditorValues) => string[];
}

export const VIEW_EDITORS: Record<ViewType, ViewEditorEntry> = {
  url: {
    schema: UrlViewConfigSchema,
    emptyDraft: { type: "url", name: {}, url: "" },
  },
  blocks: {
    schema: BlockViewConfigSchema,
    // No `root`: an empty slot is the editor's own "pick a block" state, so a new view and a
    // cleared root take the same path instead of seeding an arbitrary block type here.
    emptyDraft: { type: "blocks", name: {} },
    body: BlockViewBody,
    validate: (values) => {
      const issues = validateBlockTree(values.root as BlockLike | undefined);
      if (issues.size === 0) return [];
      // The tree marks which blocks and the form marks which fields; the toast only needs to say
      // why the save stopped.
      return [`${issues.size} block${issues.size === 1 ? "" : "s"} still have problems.`];
    },
  },
};

// Options for the type <select>, derived from the registry keys + presentation meta.
export const viewTypeOptions: { label: string; value: ViewType }[] = (
  Object.keys(VIEW_EDITORS) as ViewType[]
).map((type) => ({ label: VIEW_TYPE_META[type].label, value: type }));
