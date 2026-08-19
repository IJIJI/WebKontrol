import { z } from "zod";

/**
 * The journal: the persisted record of the most recent apply, surviving the restart the
 * apply itself triggers. Written as "applying" before the runner touches anything; the
 * next boot's reconciliation (or the healthy-uptime confirmation) settles the outcome.
 */
export const UpdateJournalSchema = z.object({
  from: z.string(),
  to: z.string(),
  moment: z.number(),
  status: z.enum(["applying", "ok", "rolled-back", "failed"]),
  error: z.string().optional(),
  /**
   * Whether an operator has seen how this update went. Absent until someone dismisses it,
   * which is what stops a months-old rollback from still reading as a live alarm. Only
   * outcomes that went wrong are worth acknowledging; a new entry starts unacknowledged.
   */
  acknowledged: z.boolean().optional(),
});
export type UpdateJournalEntry = z.infer<typeof UpdateJournalSchema>;
