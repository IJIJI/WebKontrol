import { TimeoutError } from "puppeteer";
import { KnownFailure, NavigationFailure } from "../types/model";
import { errorMessage } from "../../helpers/error";

/**
 * What kind of failure a navigation error was. Pure: the page probe result is passed in
 * rather than probed here, so the ladder is checkable without a browser.
 *
 * The order is load-bearing:
 * - Class checks first. A timeout can leave the page half torn down, and "the target
 *   took too long" is more useful than "the puppet broke" for a handle that repairs
 *   itself on the next navigation anyway.
 * - NETWORK is the remainder, not a detection. The net::ERR_ check only separates
 *   "recognised Chromium net error" from "no idea", so being wrong there costs a
 *   label, never a behaviour.
 */
export function classifyNavigationFailure(error: unknown, isPageUsable: boolean): NavigationFailure {
  if (error instanceof KnownFailure) return error.kind;
  if (error instanceof TimeoutError) return NavigationFailure.TIMEOUT;
  if (!isPageUsable) return NavigationFailure.PUPPET;

  return errorMessage(error).includes("net::ERR_")
    ? NavigationFailure.NETWORK
    : NavigationFailure.UNKNOWN;
}
