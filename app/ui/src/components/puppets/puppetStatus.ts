import { ConnectionState } from "../../../../src/types/CommonTypes";
import { NavigationState, type PuppetInfo } from "../../../../src/puppet/types/model";

/**
 * One status for a puppet, derived from its two axes. Pure and CSS-free (like statusMeta), so it
 * can be checked without a DOM; {@link PuppetStatusPill} is the component that renders it.
 *
 * A puppet's health has two axes with different remedies: whether its browser is alive (a
 * relaunch, which the orchestrator does by itself) and whether the page it was told to show came
 * up (fix the target, or wait out the retry). They are deliberately kept apart in the model, so
 * this derives and stores nothing.
 *
 * The connection wins whenever it is not ONLINE, for two reasons: its remedy is the more urgent
 * one, and a puppet whose browser is gone has no current navigation state at all. Nothing clears
 * that record, so it still says whatever was true before the browser died, and a puppet that went
 * offline mid-page would otherwise read as a cheerful "Loaded". Only once the machinery is
 * healthy does the page become the interesting axis.
 *
 * @returns the ConnectionState to take the pill's variant from, and a label when the derived
 *   meaning differs from that state's own wording.
 */
export function puppetStatus(info: PuppetInfo): { status: ConnectionState; label?: string } {
  // Not online: the connection is both the problem and the reason navigation cannot be trusted.
  // No label, so STATUS_META's own wording is used (Offline, Failed, Error, Closing).
  if (info.state !== ConnectionState.ONLINE) return { status: info.state };

  switch (info.navigation.state) {
    case NavigationState.FAILED:
      // The kind, not the word "Failed": it is what says whether a retry could help at all.
      return {
        status: ConnectionState.FAILED,
        label: info.navigation.status === undefined
          ? info.navigation.failure
          : `${info.navigation.failure} ${info.navigation.status}`,
      };
    case NavigationState.LOADING:
      return { status: ConnectionState.UNKNOWN, label: "Loading" };
    case NavigationState.LOADED:
    case NavigationState.IDLE:
      // Healthy on both axes reports the connection's own word: "Online" is what an operator
      // reads as fine, where "Loaded" would invite the question of what loaded.
      return { status: ConnectionState.ONLINE };
  }
}
