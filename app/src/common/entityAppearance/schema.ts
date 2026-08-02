import z from "zod";

// Presentation metadata shared by entities: a chosen colour and icon.
export const EntityAppearanceSchema = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex colour").optional(),
  icon: z.string().optional(), // icon id, resolved via the UI icon registry (unknown ids fall back)
});
export type EntityAppearance = z.infer<typeof EntityAppearanceSchema>;
