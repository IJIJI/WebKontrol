import { html, type TemplateResult } from "lit";
import { AsyncDirective, directive } from "lit/async-directive.js";
import type { ChildPart } from "lit/directive.js";

// Dual tone: a real segment display lights the segments it needs and leaves the rest faintly
// visible. Text alone cannot show that, so the block draws a second copy with every segment on
// behind the live one.
//
// It is asked for through the font, not a setting: view.css declares the two DSEG files under a
// second family name, and picking that name is what turns this on. So the choice sits where the
// look is chosen, it cannot be set on a font that has no all-segments glyph, and a font
// inherited from a parent block counts like any other.
//
// The upgrade path (see the backlog) is a Segment display block or a colour font; both would
// replace the font matching below, not the two-layer idea.

// The all-segments glyph per family, keyed by the dual tone family names view.css declares (the
// admin's font.less and FONT_SUGGESTIONS carry the same two). DSEG7's is "8"; DSEG14 needs "~",
// since its "8" lights only the seven-segment shape.
const SEGMENT_GLYPHS: ReadonlyArray<readonly [family: string, glyph: string]> = [
  ["dseg14 classic dual", "~"],
  ["dseg7 classic dual", "8"],
];

// Characters whose advance differs from an alphanumeric one, so replacing them would shift the
// ghost out of line with the live text: whitespace and the colon are narrower, and the decimal
// point has no advance at all (it paints onto the digit before it).
const KEEP = /[\s:.]/;

/**
 * The all-segments stand-in for `text`: same length, same character widths, so the two layers
 * line up whatever the format or the wrapping.
 */
export function ghostText(text: string, glyph: string): string {
  return [...text].map((char) => (KEEP.test(char) ? char : glyph)).join("");
}

/**
 * The all-segments glyph for a computed `font-family`, or undefined when the text is not
 * rendered in a dual tone family. Only the first family counts: that is the one the browser
 * uses when it is available, and these two always are (served next to the view).
 */
export function segmentGlyph(fontFamily: string): string | undefined {
  const first = fontFamily.split(",")[0]?.trim().replace(/^["']|["']$/g, "").toLowerCase() ?? "";
  return SEGMENT_GLYPHS.find(([family]) => first === family)?.[1];
}

class DualToneDirective extends AsyncDirective {
  private _host: Element | undefined;
  private _pending = false;

  render(text: string): string | TemplateResult {
    // First render happens while the template is still a fragment, where no font resolves yet.
    // Re-render once it is in the document; later renders (a tick, a config change upstream)
    // read the font actually in effect, so a font set on an ancestor block counts too.
    const host = this._host?.isConnected === true ? this._host : undefined;
    if (host === undefined) this._afterPaint(text);
    const glyph = host === undefined ? undefined : segmentGlyph(getComputedStyle(host).fontFamily);
    if (glyph === undefined) return text;

    return html`<span class="wk-dual"
      ><span class="wk-dual-ghost" aria-hidden="true">${ghostText(text, glyph)}</span><span>${text}</span></span
    >`;
  }

  public override update(part: ChildPart, [text]: [string]): string | TemplateResult {
    // parentNode is the block's box element, the one carrying the font styles.
    if (part.parentNode instanceof Element) this._host = part.parentNode;
    return this.render(text);
  }

  private _afterPaint(text: string): void {
    if (this._pending) return;
    this._pending = true;
    requestAnimationFrame(() => {
      this._pending = false;
      if (this.isConnected) this.setValue(this.render(text));
    });
  }
}

/** Usage in a template: `${dualTone(text)}`; a dual tone font is what turns the layers on. */
export const dualTone = directive(DualToneDirective);
