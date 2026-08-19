// Self-check for the update page's phase derivation: the whole lifecycle in order, plus
// the cases that are easy to get wrong (an apply in flight must never read as an outcome,
// and an apply that fails without restarting must not read as a rollback).
// Run with `yarn check`.
import assert from "node:assert/strict";

import { UpdateState } from "../../../../src/system/update/model";
import { updatePhase, UpdatePhase } from "./updatePhase";

const base = {
  activity: UpdateState.IDLE,
  connected: true,
  applyingTarget: null as string | null,
  sawRestart: false,
  restartedInto: null as string | null,
  current: "v3.0.0",
};

// Nothing going on.
assert.equal(updatePhase(base), UpdatePhase.NONE);
assert.equal(
  updatePhase({ ...base, activity: UpdateState.READY }),
  UpdatePhase.NONE,
  "an available release is not an overlay",
);

//* The lifecycle of one update, in the order it happens.
// 1. The click landed but the state has not arrived yet: show nothing rather than guess.
assert.equal(updatePhase({ ...base, applyingTarget: "v3.1.0" }), UpdatePhase.NONE);
// 2. The runner is working.
assert.equal(
  updatePhase({ ...base, applyingTarget: "v3.1.0", activity: UpdateState.APPLYING }),
  UpdatePhase.APPLYING,
);
// 3. The server goes away to come back on the new version.
assert.equal(
  updatePhase({ ...base, applyingTarget: "v3.1.0", connected: false }),
  UpdatePhase.RESTARTING,
);
// 3b. The connection returns on its own (EventSource retries), but this document still
// runs the old bundle: stay covered until the reload that the page triggers.
assert.equal(
  updatePhase({ ...base, applyingTarget: "v3.1.0", sawRestart: true, current: "v3.1.0" }),
  UpdatePhase.RESTARTING,
);
// 4. The page reloads: a fresh document, so the marker is what is left of the story.
assert.equal(
  updatePhase({ ...base, restartedInto: "v3.1.0", current: "v3.1.0" }),
  UpdatePhase.DONE,
);

// The supervisor rolled back: up again, but on something else.
assert.equal(
  updatePhase({ ...base, restartedInto: "v3.1.0", current: "v3.0.0" }),
  UpdatePhase.ROLLED_BACK,
);

// Failed before any swap: no restart is coming, and the version comparison must not run.
assert.equal(
  updatePhase({ ...base, applyingTarget: "v3.1.0", activity: UpdateState.FAILED }),
  UpdatePhase.FAILED,
);

// A connection blip with no update of our own in flight is not an update story at all.
assert.equal(updatePhase({ ...base, connected: false }), UpdatePhase.NONE);

// Navigating away and back mid-apply keeps the live activity authoritative.
assert.equal(
  updatePhase({
    ...base,
    activity: UpdateState.APPLYING,
    restartedInto: "v3.1.0",
    current: "v3.0.0",
  }),
  UpdatePhase.APPLYING,
);

console.log("updatePhase.check: all assertions passed");
