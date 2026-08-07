import type { StyleInfo } from "lit/directives/style-map.js";
import type { Alignment, BlockStyle } from "./types/schema";

// Maps the universal block style onto the two elements the render core emits per block: the
// slot (parent-facing, places the box) and the box (the styled element). Only config-driven
// values live here; structure and defaults come from view.css, so unset fields emit nothing
// and the inheriting font properties cascade from ancestor blocks. styleMap sets properties
// via CSSStyleDeclaration, so free CSS strings can't escape their own property.

/**
 * The box: the block's own styling. The box half (background/padding/…) styles only this
 * block; the font half is inherited by every descendant block, which is what makes setting a
 * font on a stack style all the text inside it.
 */
export function blockStyles(style: BlockStyle): StyleInfo {
  return {
    background: style.background,
    padding: style.padding,
    margin: style.margin,
    border: style.border,
    borderRadius: style.borderRadius,
    opacity: style.opacity,
    boxShadow: style.boxShadow,
    overflow: style.overflow,

    fontFamily: style.fontFamily,
    fontSize: style.fontSize === undefined ? undefined : `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    // Unitless: the CSS-correct form, relative to the element's own font size.
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing === undefined ? undefined : `${style.letterSpacing}px`,
    textTransform: style.textTransform,
    textShadow: style.textShadow,
  };
}

const FLEX_POS = {
  left: "flex-start", center: "center", right: "flex-end",
  top: "flex-start", middle: "center", bottom: "flex-end",
} as const;

/**
 * The slot: where the box sits inside the space the parent gave it. Inert while the box fills
 * that space (the box overrides with align-self: stretch); it bites once the box hugs.
 */
export function slotStyles(alignment: Alignment | undefined): StyleInfo {
  if (!alignment) return {};
  return {
    justifyContent: FLEX_POS[alignment.horizontal],
    alignItems: FLEX_POS[alignment.vertical],
  };
}

/**
 * Text-like blocks only: the same alignment that places the box also lays the text out inside
 * it (the box is a flex column), so there are never two competing alignments. Supplied through
 * the block's `boxStyles` hook rather than the generic mapper, since a container's alignment
 * must not silently re-align text in the blocks it wraps.
 */
export function textBoxStyles(alignment: Alignment | undefined): StyleInfo {
  if (!alignment) return {};
  return {
    textAlign: alignment.horizontal,
    justifyContent: FLEX_POS[alignment.vertical],
  };
}
