import type { StyleInfo } from "lit/directives/style-map.js";
import type { ContainerBlockStyle, TextBlockStyle } from "./types/schema";

// Maps the shared block style schemas to inline styles for Lit's styleMap. Only config-driven
// values live here; structural styling comes from the wk- classes in the default stylesheet.
// styleMap skips undefined entries and sets properties via CSSStyleDeclaration, so free CSS
// strings from config can't escape their own property.

export function containerStyles(style: ContainerBlockStyle): StyleInfo {
  return {
    background: style.background,
    padding: style.padding,
    border: style.border,
  };
}

export function textStyles(style: TextBlockStyle): StyleInfo {
  return {
    ...containerStyles(style),
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    textAlign: style.align,
  };
}
