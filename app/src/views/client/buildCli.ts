import { buildViewClient } from "./build";

// Standalone/CI entry: runs the same bundle the backend runs at startup, so a broken
// view client fails here (exit 1) instead of only surfacing at server boot. `build:view`.
buildViewClient()
  .then((js) => {
    console.log(`View client bundled: ${(js.length / 1024).toFixed(1)} kB.`);
  })
  .catch((error: unknown) => {
    console.error("View client build failed:", error);
    process.exit(1);
  });
