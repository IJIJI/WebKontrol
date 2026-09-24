import { Logger } from "../logging/Logger";
import { CoreDatabase } from "../storage/CoreDatabase";
import type { PuppetOrchestrator } from "../orchestration/puppet/PuppetOrchestrator";
import type { ViewManager } from "./ViewManager";
import { AnyViewConfigSchema, type AnyViewConfigInput } from "./types/schema";

// What a box shows before anyone has configured anything: the clock v2 users know, plus the
// brand, rather than the black screen an unassigned puppet used to sit on. It is an ordinary
// view, so it can be edited, reassigned or deleted like any other.
//
// Sizes are in px, tuned for 1080p: the style fields take no other unit yet (see the todo's
// units item). Positions are percentages, so they hold on any resolution.

const CLOCK_COLOR = "#cc0033"; // the failure page's red, so a display speaks with one voice
const DATE_COLOR = "#8b8b8b";
const BRAND_COLOR = "#e85d30"; // "Web"; "Kontrol" takes the admin's light text colour
const BRAND_TEXT_COLOR = "#e8e6de";

/** The seeded view's config. Exported for the check file, which parses it against the schemas. */
export const DEFAULT_VIEW_CONFIG: AnyViewConfigInput = {
  type: "blocks",
  name: { long: "Clock", short: "Clock" },
  root: {
    type: "webkontrol::block::freeform",
    items: [
      {
        // Centred, and sized to its content: the stack is exactly as wide as the clock.
        position: { x: 50, y: 50 },
        size: {},
        alignment: { horizontal: "center", vertical: "middle" },
        block: {
          type: "webkontrol::block::stack",
          direction: "column",
          align: "center",
          blocks: [
            {
              type: "webkontrol::block::datetime",
              format: "H:i:s",
              // The dual tone family draws the unlit segments behind the lit ones (dualTone.ts).
              style: { fontFamily: "DSEG7 Classic Dual", fontSize: 300, color: CLOCK_COLOR },
            },
            {
              type: "webkontrol::block::datetime",
              format: "l j F",
              style: { fontFamily: "monospace", fontSize: 64, color: DATE_COLOR },
            },
          ],
        },
      },
      {
        // Bottom right, anchored by its own corner: 56px from the right and 40px of a 1080p
        // screen from the bottom, as the mockup placed it.
        position: { x: 97.1, y: 96.3 },
        size: {},
        alignment: { horizontal: "right", vertical: "bottom" },
        block: {
          type: "webkontrol::block::stack",
          direction: "row",
          // Two blocks because the wordmark is two colours, as in the admin's own logo.
          style: { fontFamily: "Zen Dots", fontSize: 40, color: BRAND_TEXT_COLOR },
          blocks: [
            { type: "webkontrol::block::text", text: "Web", style: { color: BRAND_COLOR } },
            { type: "webkontrol::block::text", text: "Kontrol" },
          ],
        },
      },
    ],
  },
};

/**
 * Create the default view on a box that has never held data, and put it on every screen with
 * no view of its own. Only ever on a fresh database: an install that already ran has made its
 * own choices, including the choice to delete this view.
 *
 * Runs after the orchestrator started, because that is when its runtime store opens; the
 * puppets therefore show blank for the moment it takes, once, on the very first boot.
 */
export async function seedDefaultView(views: ViewManager, puppets: PuppetOrchestrator): Promise<void> {
  if (!CoreDatabase.getInstance().isFresh) return;

  const logger = new Logger(["VIEW", "SEED"]);
  try {
    const key = await views.createView(AnyViewConfigSchema.parse(DEFAULT_VIEW_CONFIG));
    await puppets.setDefaultView(key);
    logger.important(`Fresh database: created the default view "${key}" and put it on every unassigned screen.`);
  } catch (error) {
    // A box that boots without its welcome screen is a blemish, not a reason to refuse to run.
    logger.error("Failed to create the default view.", error);
  }
}
