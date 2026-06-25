import { defineConfig } from "tsup";

export default defineConfig({
  entry: { app: "app.ts", supervisor: "supervisor.ts" },
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  splitting: false,
  clean: false,
  external: ["pigpio"],
});
