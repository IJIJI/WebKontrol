import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { NavigationFailure } from "./types/model";

/**
 * The locally rendered page a puppet shows when its target failed to load. Written to
 * the display via setContent, so it must be fully self-contained: no server, no network
 * and no URL resolution exist in its failure path, which is the reason it is not a
 * served route. The ticking clock is proof of life, a frozen stale view lies about the
 * time implicitly, this page tells it correctly and demonstrably live.
 */
export interface FallbackData {
  /** What the display was supposed to show, in operator terms (the view's long name). */
  label: string;
  failure: NavigationFailure;
  error: string;
  retryInMs: number;
}

/** Escape a value for interpolation into HTML text. The error message can echo content from a hostile target. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const CLOCK_FONT_STACK = `"DSEG7 Classic", "Segment7", ui-monospace, "Cascadia Mono", Consolas, monospace`;

// The page can fetch nothing, so the font travels inside the HTML as a data URI.
// DSEG is SIL OFL 1.1; the licence file lives beside the font, and views get the same
// files served over HTTP in fonts stage 2. A missing file degrades to the monospace
// stack rather than breaking the page.
const CLOCK_FONT_FACE = (() => {
  try {
    const woff2 = readFileSync(
      fileURLToPath(new URL("../assets/fonts/DSEG/DSEG7Classic-Regular.woff2", import.meta.url)),
    );
    return `@font-face {
    font-family: "DSEG7 Classic";
    src: url("data:font/woff2;base64,${woff2.toString("base64")}") format("woff2");
  }`;
  } catch {
    return "";
  }
})();

export function renderFallbackPage(data: FallbackData): string {
  const retrySeconds = Math.max(1, Math.round(data.retryInMs / 1000));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(data.label)} failed to load</title>
<style>
  ${CLOCK_FONT_FACE}
  html, body {
    margin: 0;
    height: 100%;
    background: #1c1c1e;
    color: #d6d6d6;
    font-family: system-ui, sans-serif;
    overflow: hidden;
  }
  main {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    text-align: center;
  }
  .clock {
    position: relative;
    font-family: ${CLOCK_FONT_STACK};
    font-size: 16vw;
    line-height: 1;
    margin: 0;
    font-weight: normal;
    color: #cc0033; /* the ghost segments inherit this, dimmed by their opacity */
  }
  /* All segments lit behind the live digits, so it reads as real hardware. */
  .clock .bg {
    position: absolute;
    inset: 0;
    opacity: 0.07;
    user-select: none;
  }
  .clock .face {
    position: relative;
  }
  .label {
    font-size: 2.2vw;
    color: #d6d6d6;
  }
  .label b {
    font-style: italic;
  }
  .detail {
    font-size: 1.4vw;
    color: #8b8b8b;
  }
</style>
</head>
<body>
<main>
  <h1 class="clock"><span class="bg">88:88:88</span><span class="face" id="clock"></span></h1>
  <div class="label"><b>${escapeHtml(data.label)}</b> failed to load.</div>
  <div class="detail">${escapeHtml(data.failure)}: ${escapeHtml(data.error)}</div>
  <div class="detail">Retrying in <b id="countdown">${retrySeconds}</b></div>
</main>
<script>
  const pad = (n) => String(n).padStart(2, "0");

  const clock = document.getElementById("clock");
  function updateClock() {
    const now = new Date();
    clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  }
  updateClock();
  setInterval(updateClock, 250);

  const countdown = document.getElementById("countdown");
  let left = ${JSON.stringify(retrySeconds)};
  const tick = setInterval(() => {
    left -= 1;
    if (left > 0) {
      countdown.textContent = String(left);
    } else {
      countdown.parentElement.textContent = "Retrying…";
      clearInterval(tick);
    }
  }, 1000);
</script>
</body>
</html>`;
}
