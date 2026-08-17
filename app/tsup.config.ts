import { defineConfig } from "tsup";

export default defineConfig({
  entry: { app: "app.ts", supervisor: "supervisor.ts" },
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  splitting: false,
  // tsup runs FIRST in the build chain precisely so it may clean: vite (dist/ui) and
  // assembleDist (assets, view client) write into dist after it.
  clean: true,
  // The bundle identifies itself as the production artifact (src/helpers/assets.ts reads
  // this, nothing else may). Source run under tsx leaves the identifier undefined = dev.
  define: { __WK_PROD__: "true" },
  // esbuild is used at runtime (view client build) and ships a native binary. Keep it
  // external so tsup doesn't try to bundle it into the backend.
  external: ["pigpio", "esbuild"],
});
