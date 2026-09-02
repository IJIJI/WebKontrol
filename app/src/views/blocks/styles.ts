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
    wordSpacing: style.wordSpacing === undefined ? undefined : `${style.wordSpacing}px`,
    textTransform: style.textTransform,
    textDecoration: style.textDecoration,
    textShadow: style.textShadow,
  };
}

/** Anything that is not one of the two keywords (and not blank) is a CSS length. */
const isLength = (value?: string): value is string =>
  value !== undefined && value !== "" && value !== "content" && value !== "container";

/** Blank means unset: a cleared editor field stores "", which must not reach CSS. */
const orUnset = (value?: string): string | undefined => (value === "" ? undefined : value);

/**
 * The box's own size, per axis. The slot around it is always a flex row, so within it X is the
 * main axis and Y the cross one whichever way the block's *parent* flows: this mapping is the
 * same everywhere, and only the slot (see slotSizeStyles) needs to know the parent's direction.
 *
 * A length pins its axis (`0 0 <len>`): fixed means fixed, and the slot clips any excess rather
 * than letting a box shrink out from under a value someone typed. `content` keeps `0 1 auto`
 * (never `0 0 auto`, which would render a paragraph as one endless line) clamped to the slot.
 */
export function sizeStyles(style: BlockStyle): StyleInfo {
  const x = style.size?.x;
  const y = style.size?.y;
  return {
    // Main axis: how the box takes width inside its slot.
    flex: x === "container" ? "1 1 auto" : isLength(x) ? `0 0 ${x}` : "0 1 auto",
    width: isLength(x) ? x : undefined,
    // An explicit maximum wins over the hug clamp; both stop a box painting over its neighbours.
    maxWidth: orUnset(style.maxSize?.x) ?? (x === "content" ? "100%" : undefined),
    minWidth: orUnset(style.minSize?.x),

    // Cross axis: stretch to the slot, or take the height the content asks for.
    alignSelf: y === "container" ? "stretch" : "auto",
    height: isLength(y) ? y : undefined,
    maxHeight: orUnset(style.maxSize?.y) ?? (y === "content" ? "100%" : undefined),
    minHeight: orUnset(style.minSize?.y),

    aspectRatio: orUnset(style.aspectRatio),
  };
}

/**
 * The slot's own sizing, which is the only part that depends on how the parent flows: inside a
 * stack the slot must hug on the stack's main axis, or it would swallow the free space and the
 * stack's gap and justify would have nothing left to distribute.
 *
 * @param parentAxis - The enclosing stack's direction, absent outside a stack (a grid cell,
 *   a freeform item and a container slot are all sized by the parent instead).
 */
export function slotSizeStyles(style: BlockStyle, parentAxis?: "row" | "column"): StyleInfo {
  const x = style.size?.x;
  const y = style.size?.y;
  const alongParent = parentAxis === "column" ? y : x;
  // Only a box that is not filling can outgrow the space it was given. Clipping belongs on the
  // slot rather than the box's own max-*: that percentage resolves only against a definite
  // slot, and a slot sized by flex (a stack that ran out of room) is not definite.
  const canOutgrow = x !== "container" || y !== "container";
  return {
    flex: parentAxis !== undefined && alongParent !== "container" ? "0 1 auto" : undefined,
    overflow: canOutgrow && style.overflow !== "visible" ? "hidden" : undefined,
  };
}

const FLEX_POS = {
  left: "flex-start", center: "center", right: "flex-end",
  top: "flex-start", middle: "center", bottom: "flex-end",
} as const;

/**
 * Where the box sits inside the space the parent gave it. Inert on an axis the box fills (it
 * overrides with flex-grow or align-self: stretch); it bites on an axis the box hugs or pins,
 * which is the only time there is leftover space to place it in.
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
