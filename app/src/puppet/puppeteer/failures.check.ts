import assert from "node:assert/strict";
import { TimeoutError } from "puppeteer";
import { KnownFailure, NavigationFailure } from "../types/model";
import { classifyNavigationFailure } from "./failures";
import { repairDelay } from "../pacing";

// The classifier is an ordered ladder, and the ordering is the point of these checks:
// a reorder that typechecks fine can still misclassify.

// KnownFailure wins over everything, including a dead page.
assert.equal(
  classifyNavigationFailure(new KnownFailure(NavigationFailure.STATUS, "Target responded 404"), true),
  NavigationFailure.STATUS,
);
assert.equal(
  classifyNavigationFailure(new KnownFailure(NavigationFailure.STATUS, "Target responded 404"), false),
  NavigationFailure.STATUS,
);

// A timeout on a half torn down page is still a timeout: "the target took too long"
// beats "the puppet broke" for a handle that repairs itself on the next navigation.
// The assertion most likely to catch a future reorder of the ladder.
assert.equal(classifyNavigationFailure(new TimeoutError("timed out"), false), NavigationFailure.TIMEOUT);
assert.equal(classifyNavigationFailure(new TimeoutError("timed out"), true), NavigationFailure.TIMEOUT);

// An unrecognised error on a dead page is the page's death.
assert.equal(classifyNavigationFailure(new Error("Attempted to use detached Frame"), false), NavigationFailure.PUPPET);

// Chromium net errors are recognised by their stable identifier, never by prose.
assert.equal(
  classifyNavigationFailure(new Error("net::ERR_NAME_NOT_RESOLVED at https://example.test"), true),
  NavigationFailure.NETWORK,
);

// Anything else is honestly unknown.
assert.equal(classifyNavigationFailure(new Error("something else entirely"), true), NavigationFailure.UNKNOWN);

// catch binds unknown: non-Error throws must classify, not crash.
assert.equal(classifyNavigationFailure("boom", true), NavigationFailure.UNKNOWN);
assert.equal(classifyNavigationFailure(undefined, true), NavigationFailure.UNKNOWN);

// KnownFailure carries its extras through a catch as unknown.
const caught: unknown = new KnownFailure(NavigationFailure.STATUS, "Target responded 503", 503);
assert.ok(caught instanceof KnownFailure);
assert.equal(caught.status, 503);

// Repair pacing: a first crash repairs immediately, density escalates, the cap holds.
assert.equal(repairDelay(0), 0);
assert.equal(repairDelay(1), 0);
assert.equal(repairDelay(2), 2_000);
assert.equal(repairDelay(3), 4_000);
assert.equal(repairDelay(4), 8_000);
assert.equal(repairDelay(20), 5 * 60_000); // capped, never longer
assert.equal(repairDelay(1000), 5 * 60_000); // no overflow past the cap

console.log("failures.check: all assertions passed");
