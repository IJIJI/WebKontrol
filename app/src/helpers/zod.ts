import z from "zod";

// TODO: Probably remove, it is overcomplicated
/**
 * Merges a specific schema with a base schema, injects a literal type discriminator,
 * and applies a compile-time brand.
 * * @param brandName The literal string used for both the runtime 'type' field and the TS brand.
 * @param baseSchema The foundational Zod object (e.g., global configs, IDs).
 * @param specificSchema The specific Zod object to merge into the base.
 */
export function withBaseAndBrand<
  const BrandTypeName extends string,
  const BrandKeyName extends string,
  // Replace AnyZodObject with ZodObject<any, any, any>
  BaseSchema extends z.ZodObject<any, any>,
>(
  base: BaseSchema,
  brandType: BrandTypeName,
  brandKey: BrandKeyName,
  shape: BaseSchema,
) {
  return base
    .extend({
      ...shape,
      baseType: z.literal(brandType),
      keyType: z.literal(brandKey),
    })
    .brand<BrandTypeName>()
    .brand<BrandKeyName>();
}