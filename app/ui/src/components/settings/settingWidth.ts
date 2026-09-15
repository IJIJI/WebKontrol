import { createContext } from "react";

// How a setting lays out its label vs. its input(s):
//  WIDE:    title/subtitle on the left, inputs on the right (the settings-page default).
//  COMPACT: everything stacked in one column. Title, then each labelled input full-width.
//  AUTO:    WIDE until the field itself is narrower than a threshold, then COMPACT (via a CSS
//             container query, no JS).
export enum SettingWidth {
  WIDE = "wide",
  COMPACT = "compact",
  AUTO = "auto",
}

// A container (e.g. a modal sized by its ModalSize) can set the width its settings default to.
// An explicit `width` prop on a setting still wins over this.
export const SettingWidthContext = createContext<SettingWidth | undefined>(undefined);
