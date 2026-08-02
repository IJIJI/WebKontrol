import z from "zod";

// Presentation metadata shared by entities: a chosen colour and icon.
export const EntityMetaSchema = z.object({
  color: z.string().optional(),
  icon: z.string().optional(), // icon id, resolved via the UI icon registry
});
export type EntityMeta = z.infer<typeof EntityMetaSchema>;
