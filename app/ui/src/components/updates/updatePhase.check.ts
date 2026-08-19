// Self-check for the update overlay's phase derivation: the whole lifecycle in order, for
// the admin that started the update AND for any other admin watching it happen, plus the
// cases that are easy to get wrong (an update in flight must never read as an outcome,
// and a failure that swapped nothing must not read as a rollback). Run with `yarn check`.
import assert from "node:assert/strict";

import { UpdateState } from "../../../../src/system/update/model";
import { updatePhase, UpdatePhase } from "./updatePhase";

const base = {
  activity: UpdateState.IDLE,
  connected: true,
  sawApplying: false,
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
assert.equal(
  updatePhase({ ...base, connected: false }),
  UpdatePhase.NONE,
  "a connection blip with no update running is not an update story",
);

//* One update, in the order it happens. Nothing here is specific to the admin that
//* started it: every open admin sees the same broadcast state.
// 1. The runner is working and still able to say so.
assert.equal(
  updatePhase({ ...base, activity: UpdateState.APPLYING }),
  UpdatePhase.APPLYING,
);
// 2. The server goes away to come back on the new version.
assert.equal(
  updatePhase({ ...base, activity: UpdateState.APPLYING, connected: false, sawApplying: true }),
  UpdatePhase.RESTARTING,
);
// 3. It answers again, but this document still runs the old bundle: stay covered until
//    the reload the page triggers.
assert.equal(
  updatePhase({ ...base, sawApplying: true, current: "v3.1.0" }),
  UpdatePhase.RESTARTING,
);
// 4. After that reload: a fresh document, where the marker is what is left of the story.
assert.equal(
  updatePhase({ ...base, restartedInto: "v3.1.0", current: "v3.1.0" }),
  UpdatePhase.DONE,
);

// The supervisor rolled back: up again, but on something else.
assert.equal(
  updatePhase({ ...base, restartedInto: "v3.1.0", current: "v3.0.0" }),
  UpdatePhase.ROLLED_BACK,
);

// An admin that did not start the update has no marker, so it reloads into silence.
assert.equal(updatePhase({ ...base, current: "v3.1.0" }), UpdatePhase.NONE);

// Failed before any swap: no restart is coming, and the version comparison must not run.
assert.equal(
  updatePhase({ ...base, activity: UpdateState.FAILED, sawApplying: true }),
  UpdatePhase.FAILED,
);

console.log("updatePhase.check: all assertions passed");
