import fs from "node:fs";
import path from "node:path";
import { buildViewClient } from "../src/views/client/build";

// Assembles the runtime image after the compilers ran: `tsup` wrote dist/app.js +
// dist/supervisor.js and `vite build` wrote dist/ui; this adds everything the server reads
// from disk at runtime. dist/ mirrors the src-relative layout, which is what lets
// src/helpers/assets.ts resolve one relative path in both dev and prod.
//
// Run from the repo root (yarn build does); tsx, not node, since it imports src TS.

// The whole assets directory, not a curated list: src/assets IS the shipped-assets dir by
// definition, so anything placed there ships without this script needing to hear about it.
// A curated list's failure mode (add a font, forget the list, prod 404s at a customer) is
// exactly the class of bug the mirror exists to prevent. Font licences travel with their
// fonts for free (SIL OFL requires it).
const COPY_DIRS = ["assets"];
const COPY_FILES = ["views/client/index.html", "views/client/view.css"];

const SRC = path.join(process.cwd(), "src");
const DIST = path.join(process.cwd(), "dist");

for (const rel of COPY_FILES) {
  fs.mkdirSync(path.dirname(path.join(DIST, rel)), { recursive: true });
  fs.copyFileSync(path.join(SRC, rel), path.join(DIST, rel));
}
for (const rel of COPY_DIRS) {
  fs.cpSync(path.join(SRC, rel), path.join(DIST, rel), { recursive: true });
}
console.log(`Copied ${COPY_FILES.length} files + ${COPY_DIRS.join(", ")} into dist/.`);

// The view client, compiled once here instead of at every boot: esbuild stays out of the
// runtime, and a broken client fails the build instead of 503ing at a customer.
// BlockViewClient reads this exact path in prod.
const bundle = await buildViewClient();
const bundlePath = path.join(DIST, "views", "client", "bundle.js");
fs.writeFileSync(bundlePath, bundle);
console.log(`View client bundled: ${(bundle.length / 1024).toFixed(1)} kB -> ${path.relative(process.cwd(), bundlePath)}.`);
