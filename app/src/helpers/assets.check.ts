// Self-check for the asset helper's dev half: under tsx the constant reads dev and every
// shipped asset resolves to a real file in src/. The prod half (the same relative paths
// against dist/) is exercised by running the built artifact, which no check file can do.
// Run with `yarn check`.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { asset, IS_PROD } from "./assets";

assert.equal(IS_PROD, false, "source run under tsx must identify as dev");

// The exact files the build mirrors into dist/ (scripts/assembleDist.ts): if one moves in
// src without the mirror following, this fails here instead of at a customer's boot.
const SHIPPED = [
  "views/client/index.html",
  "views/client/view.css",
  "assets/fonts/DSEG/DSEG7Classic-Regular.woff2",
  "assets/fonts/DSEG/DSEG14Classic-Regular.woff2",
];
for (const rel of SHIPPED) {
  assert.equal(existsSync(asset(rel)), true, `asset "${rel}" resolves to a real file in dev`);
}

console.log("assets.check: all assertions passed");
