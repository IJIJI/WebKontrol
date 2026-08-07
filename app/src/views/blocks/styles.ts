import type { StyleInfo } from "lit/directives/style-map.js";
import type { Alignment, BlockStyle } from "./types/schema";

// Maps the universal block style to inline styles for Lit's styleMap. Only config-driven
// values live here; structural styling and defaults come from view.css, so unset fields emit
// nothing (and the inheriting font properties then cascade from ancestor blocks). styleMap
// sets properties via CSSStyleDeclaration, so free CSS strings can't escape their property.

/** The box half: styles the block's own box, never inherited by children. */
export function containerStyles(style: BlockStyle): StyleInfo {
  return {
    background: style.background,
    padding: style.padding,
    border: style.border,
    borderRadius: style.borderRadius,
    opacity: style.opacity,
    boxShadow: style.boxShadow,
    overflow: style.overflow,
  };
}

const FLEX_POS = {
  left: "flex-start", center: "center", right: "flex-end",
  top: "flex-start", middle: "center", bottom: "flex-end",
} as const;

/** How a chip-capable block's root places its content element (pair with the .wk-align class). */
export function placementStyles(alignment: Alignment | undefined): StyleInfo {
  if (!alignment) return {};
  return {
    justifyContent: FLEX_POS[alignment.horizontal],
    alignItems: FLEX_POS[alignment.vertical],
  };
}

/** Box + font: the font half cascades to descendant blocks (CSS inheritance). */
export function textStyles(style: BlockStyle): StyleInfo {
  return {
    ...containerStyles(style),
    fontFamily: style.fontFamily,
    fontSize: style.fontSize === undefined ? undefined : `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    // Unitless: the CSS-correct form, relative to the element's own font size.
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing === undefined ? undefined : `${style.letterSpacing}px`,
    textTransform: style.textTransform,
    textAlign: style.alignment?.horizontal,
    // The content element is a flex column (.wk-align > *): when it is stretched over the
    // whole block (container sizing), this distributes the text vertically inside it.
    justifyContent: style.alignment === undefined ? undefined : FLEX_POS[style.alignment.vertical],
  };
}
