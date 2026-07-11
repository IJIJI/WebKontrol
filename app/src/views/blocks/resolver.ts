import z from "zod";
import { AnyBlockConfigSchema, isBlockSlot, type DataSourceKey } from "./types/schema";
import type { ResolvedBlock } from "./types/model";
import type { BlockTypeRegistry } from "./registry";

/**
 * Peel any single-inner wrapper (optional, nullable, default, readonly, catch,
 * nonoptional, ...) to reach the schema that may be a slot or container. All such
 * wrappers expose `def.innerType`; containers (object/array/union) do not, so this
 * stops at the first meaningful schema. Missing a wrapper would silently skip the
 * slots inside it, so peel generically rather than per-type.
 */
function unwrap(schema: z.ZodType): z.ZodType {
  let s: z.ZodType = schema;
  let inner = (s.def as { innerType?: z.ZodType }).innerType;
  while (inner) {
    s = inner;
    inner = (s.def as { innerType?: z.ZodType }).innerType;
  }
  return s;
}

/**
 * Walk a parsed config value guided by its schema, replacing every block slot
 * in-place with a resolved child block. Slot-free subtrees are returned by
 * reference (structural sharing) so nothing is needlessly cloned. Child
 * dependencies encountered along the way are unioned into `deps`.
 */
function resolveValue(
  schema: z.ZodType,
  value: unknown,
  registry: BlockTypeRegistry,
  deps: Set<DataSourceKey>,
): unknown {
  if (value === undefined || value === null) return value;

  const core = unwrap(schema);

  if (isBlockSlot(core)) {
    const child = resolveBlock(value, registry);
    for (const dep of child.dependencies) deps.add(dep);
    return child;
  }

  if (core instanceof z.ZodObject) {
    const shape = core.shape as Record<string, z.ZodType>;
    const source = value as Record<string, unknown>;
    let result = source;
    for (const key of Object.keys(shape)) {
      const resolved = resolveValue(shape[key], source[key], registry, deps);
      if (resolved !== source[key]) {
        if (result === source) result = { ...source };
        result[key] = resolved;
      }
    }
    return result;
  }

  if (core instanceof z.ZodArray) {
    const element = core.element as z.ZodType;
    const source = value as unknown[];
    let result = source;
    for (let i = 0; i < source.length; i++) {
      const resolved = resolveValue(element, source[i], registry, deps);
      if (resolved !== source[i]) {
        if (result === source) result = [...source];
        result[i] = resolved;
      }
    }
    return result;
  }

  // Leaf, union, or anything else without slots: share by reference.
  return value;
}

/**
 * Resolve a raw block config into a {@link ResolvedBlock}: validate it against
 * its registered type, resolve its child slots recursively, and collect the
 * data sources its subtree depends on.
 *
 * @param raw - The stored/authored block config (an envelope with a `type` key).
 * @param registry - The registry to resolve block types and children against.
 * @returns The resolved block tree.
 */
export function resolveBlock(raw: unknown, registry: BlockTypeRegistry): ResolvedBlock {
  const envelope = AnyBlockConfigSchema.parse(raw);
  const def = registry.get(envelope.type);
  // TODO: typed error + render an error placeholder for this block instead of
  // throwing, so one bad block can't take down the whole view.
  if (!def) throw new Error(`Unknown block type "${envelope.type}".`);

  const config: unknown = def.configSchema.parse(raw);
  const deps = new Set<DataSourceKey>(def.getDataDependencies(config));
  const resolvedConfig = resolveValue(def.configSchema, config, registry, deps);

  return {
    def,
    config: resolvedConfig,
    dependencies: [...deps],
  };
}
