// Shared visual variants for labelled/interactive components (Button, pills, …). The string values
// double as CSS class names, so they must stay in sync with those components' LESS.
// TODO: move to a `common/` module (alongside useDraft / draft-save) once that exists.

// A component's semantic colour role. (Distinct from beacon's TallyState, which is a tally domain.)
export enum Variant {
  DEFAULT = "default",
  ACCENT = "accent",
  SUCCESS = "success",
  DANGER = "danger",
  WARNING = "warning",
  INFO = "info",
}

// How the variant colour is applied: a solid fill or a skeleton (outline) treatment.
export enum FillStyle {
  FILLED = "filled",
  SKELETON = "skeleton",
}
