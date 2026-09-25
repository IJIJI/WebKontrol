// Self-check for the dual tone helpers: the ghost copy must line up with the live text
// character for character, and only a DSEG font may produce one. The directive itself needs a
// browser (it reads the computed font), so it is covered by the view test instead.
// Dual tone is asked for through the font: only the "Dual" families render the layers.
// Run with `yarn check`.
import assert from "node:assert/strict";

import { ghostText, segmentGlyph } from "./dualTone";

//* ghostText: same length, and only the characters whose advance differs stay themselves.
assert.equal(ghostText("12:34:56", "8"), "88:88:88", "digits become the all-segments glyph");
assert.equal(ghostText("Sat 19", "~"), "~~~ ~~", "letters too, spaces kept");
assert.equal(ghostText("12.5", "8"), "88.8", "the decimal point is kept (it has no advance)");
assert.equal(ghostText("", "8"), "", "empty text stays empty");
assert.equal(ghostText("a\nb", "8"), "8\n8", "newlines survive, so pre-line wrapping matches");
for (const text of ["12:34:56", "Sat 19", "a\nb", "-/,%"]) {
  assert.equal([...ghostText(text, "8")].length, [...text].length, `same length for "${text}"`);
}

//* segmentGlyph: only the dual tone families qualify, and only as the first family, since that
//* is the one the browser renders.
assert.equal(segmentGlyph('"DSEG7 Classic Dual"'), "8", "DSEG7 uses 8");
assert.equal(segmentGlyph('"DSEG14 Classic Dual"'), "~", "DSEG14 uses ~, its 8 lights only seven segments");
assert.equal(segmentGlyph("DSEG7 Classic Dual, monospace"), "8", "unquoted, with a fallback behind it");
assert.equal(segmentGlyph("DSEG7 CLASSIC DUAL"), "8", "family names are case-insensitive");
assert.equal(segmentGlyph('"DSEG7 Classic"'), undefined, "the plain family renders plain segments");
assert.equal(segmentGlyph('"DSEG14 Classic"'), undefined, "the plain family renders plain segments");
assert.equal(segmentGlyph('Arial, "DSEG7 Classic Dual"'), undefined, "another family in front wins");
assert.equal(segmentGlyph("system-ui, sans-serif"), undefined, "the page default gets no ghost");
assert.equal(segmentGlyph(""), undefined, "an unresolved font gets no ghost");

console.log("dualTone.check: all assertions passed");
