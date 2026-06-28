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
  },
  plugins: [react()],
  customLogger,
});
