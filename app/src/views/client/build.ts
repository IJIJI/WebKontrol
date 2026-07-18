import path from "node:path";
import { build, stop } from "esbuild";

// Bundles the browser view-client (client/main.ts + the block system + lit + zod) into a
// single ESM string. Called by the backend at startup (ViewManager.init, wrapped in try/
// catch) and by the `build:view` script for a standalone/CI check — one config, two callers.
// No dev/prod split: build once, restart the app to pick up changes (no watcher).

const ENTRY = path.join(process.cwd(), "src", "views", "client", "main.ts");

export async function buildViewClient(): Promise<string> {
  try {
    const result = await build({
      entryPoints: [ENTRY],
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "es2022",
      write: false, // keep it in memory; the server serves the string
      logLevel: "silent", // errors surface via the thrown exception, not esbuild's stdout
    });

    const output = result.outputFiles[0];
    if (!output) throw new Error("View client build produced no output.");
    return output.text;
  } finally {
    // We build exactly once (at startup); release esbuild's background service child.
    await stop();
  }
}
