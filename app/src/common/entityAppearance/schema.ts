import z from "zod";

// Presentation metadata shared by entities: a chosen colour and icon.
export const EntityAppearanceSchema = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex colour").optional(),
  icon: z.string().optional(), // icon id, resolved via the UI icon registry (unknown ids fall back)
});
export type EntityAppearance = z.infer<typeof EntityAppearanceSchema>;

// How to embed appearance on an entity config: an all-empty appearance ({} or all-undefined keys)
// collapses to undefined, so touching-then-clearing in the editor never persists an empty object.
// `.transform` is inner and `.optional()` outer, so the field stays omittable and the transform
// only ever sees the object, not undefined.
export const EntityAppearanceField = EntityAppearanceSchema
  .transform((a) => (a.color !== undefined || a.icon !== undefined ? a : undefined))
  .optional();
