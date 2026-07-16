import { resolve } from "node:path";
import { defineConfig, type Logger as ViteLogger } from "vite";
import react from "@vitejs/plugin-react";
import { Logger } from "./src/logging/Logger.js";

const logger = new Logger(["WEB", "VITE"]);
// eslint-disable-next-line no-control-regex
const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");
const warnedOnce = new Set<string>();

const customLogger: ViteLogger = {
  hasWarned: false,
  info(msg) {
    logger.info(stripAnsi(msg));
  },
  warn(msg) {
    this.hasWarned = true;
    logger.warn(stripAnsi(msg));
  },
  warnOnce(msg) {
    if (warnedOnce.has(msg)) return;
    warnedOnce.add(msg);
    this.warn(msg);
  },
  error(msg) {
    logger.error(stripAnsi(msg));
  },
  clearScreen() {},
  hasErrorLogged() {
    return false;
  },
};

export default defineConfig({
  root: "ui",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    // Two-page app: the React admin (index.html) and the lit powered block-view
    // renderer (view/index.html), built together into dist/ui. Declaring inputs turns
    // off Vite's default single-entry, so both must be listed. Dev needs neither entry
    // here, as Vite serves modules on demand; this is purely for the prod build.
    rollupOptions: {
      input: {
        main: resolve(__dirname, "ui/index.html"),
        view: resolve(__dirname, "ui/view/index.html"),
      },
    },
  },
  plugins: [react()],
  customLogger,
  css: {
    // TODO: Is this the right way?
    preprocessorOptions: {
      less: {
        additionalData: '@import "./ui/src/styles/variables/variables.less";',
      },
    },
  },
});
