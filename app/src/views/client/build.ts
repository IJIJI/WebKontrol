import path from "node:path";

// Bundles the browser view-client (client/main.ts + the block system + lit + zod) into a
// single ESM string. Called by the dev backend at startup (ViewManager.init, wrapped in
// try/catch) and at build time by assembleDist and the `build:view` check — one config for
// all callers. Prod reads the prebuilt result instead (see BlockViewClient).

const ENTRY = path.join(process.cwd(), "src", "views", "client", "main.ts");

export async function buildViewClient(): Promise<string> {
  // Imported here, not at module top: a static import gets hoisted into dist/app.js when
  // this file is bundled (splitting is off), which would make esbuild a hard runtime
  // dependency of production for a function production never calls.
  const { build, stop } = await import("esbuild");
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
