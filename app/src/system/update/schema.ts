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
});
export type UpdateJournalEntry = z.infer<typeof UpdateJournalSchema>;
