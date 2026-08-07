import type { StyleInfo } from "lit/directives/style-map.js";
import type { Alignment, ContainerBlockStyle, TextBlockStyle } from "./types/schema";

// Maps the shared block style schemas to inline styles for Lit's styleMap. Only config-driven
// values live here; structural styling comes from the wk- classes in the default stylesheet.
// styleMap skips undefined entries and sets properties via CSSStyleDeclaration, so free CSS
// strings from config can't escape their own property.

export function containerStyles(style: ContainerBlockStyle): StyleInfo {
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
export function placementStyles(alignment: Alignment): StyleInfo {
  return {
    justifyContent: FLEX_POS[alignment.horizontal],
    alignItems: FLEX_POS[alignment.vertical],
  };
}

export function textStyles(style: TextBlockStyle): StyleInfo {
  return {
    ...containerStyles(style),
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    // Unitless: the CSS-correct form, relative to the element's own font size.
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing === undefined ? undefined : `${style.letterSpacing}px`,
    textTransform: style.textTransform,
    textAlign: style.alignment.horizontal,
    // The content element is a flex column (.wk-align > *): when it is stretched over the
    // whole block (container sizing), this distributes the text vertically inside it.
    justifyContent: FLEX_POS[style.alignment.vertical],
  };
}
