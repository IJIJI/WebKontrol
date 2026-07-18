import { defineConfig } from "tsup";

export default defineConfig({
  entry: { app: "app.ts", supervisor: "supervisor.ts" },
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  splitting: false,
  clean: false,
  // esbuild is used at runtime (view client build) and ships a native binary — keep it
  // external so tsup doesn't try to bundle it into the backend.
  external: ["pigpio", "esbuild"],
});
