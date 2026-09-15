import path from "node:path";
import { fileURLToPath } from "node:url";

// Defined by tsup at build time (see tsup.config.ts). Only this module may read it: the
// constant is how the built artifact identifies itself, and keeping the identifier to one
// file keeps that magic contained. Everything else imports IS_PROD.
// eslint-disable-next-line @typescript-eslint/naming-convention -- the dunder marks a build-time define, the convention esbuild/vite established (__DEV__ and friends).
declare const __WK_PROD__: boolean;

/**
 * Whether this process is the built artifact (dist/) rather than source run under tsx.
 *
 * A build-time constant rather than NODE_ENV, for the same reason the UI has
 * `import.meta.env.DEV`: the artifact knows what it is. With an env var, a bare
 * `node dist/app.js` would come up in development mode and try to serve the admin through
 * dev-mode Vite, which is not installed in a deployment. No script, unit file or container
 * needs to remember to set anything.
 */
export const IS_PROD: boolean = typeof __WK_PROD__ !== "undefined" && __WK_PROD__;

// Where the shipped read-only assets live. The build mirrors the src-relative layout into
// dist/ (see scripts/assembleDist.ts), so one relative path works in both modes:
// - prod: the directory of the running bundle. tsup flattens both entries (app.js,
//   supervisor.js) into dist/ itself, so "./" of this module IS the asset root.
// - dev: <cwd>/src, the same assumption every existing process.cwd() read makes
//   (yarn dev runs from the repo root).
// Mutable state (config/, db/, logs/) stays cwd-relative on purpose; this is only for
// files that ship with the code.
const ASSET_ROOT = IS_PROD
  ? fileURLToPath(new URL("./", import.meta.url))
  : path.join(process.cwd(), "src");

/**
 * Absolute path of a shipped asset, from its root-relative path (e.g. "views/client/view.css").
 * Build-only artifacts with no src twin (the admin bundle at "ui") resolve too; they simply
 * have no dev fallback, and their readers are behind IS_PROD.
 */
export function asset(relPath: string): string {
  return path.join(ASSET_ROOT, relPath);
}
