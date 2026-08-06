import z from "zod";
import { AnyBlockConfigSchema, isBlockSlot, type DataSourceKey } from "./types/schema";
import { isBroken, type ResolvedNode } from "./types/model";
import type { BlockTypeRegistry } from "./registry";

/**
 * Peel any single-inner wrapper (optional, nullable, default, readonly, catch,
 * nonoptional, ...) to reach the schema that may be a slot or container. All such
 * wrappers expose `def.innerType`; containers (object/array/union) do not, so this
 * stops at the first meaningful schema. Missing a wrapper would silently skip the
 * slots inside it, so peel generically rather than per-type.
 * Exported: the admin's block-tree walk (blockUtils.childBlocks) peels the same way.
 */
export function unwrap(schema: z.ZodType): z.ZodType {
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
    // A broken child contributes no dependencies; it renders a placeholder instead.
    if (!isBroken(child)) for (const dep of child.dependencies) deps.add(dep);
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
 * Resolve a raw block config into a {@link ResolvedNode}: validate it against its registered
 * type, resolve its child slots recursively, and collect the data sources its subtree depends on.
 *
 * Never throws for bad content. An unknown type or a config its schema rejects resolves to a
 * BrokenBlock, so the failure stays local to that block and the rest of the view still renders.
 *
 * @param raw - The stored/authored block config (an envelope with a `type` key).
 * @param registry - The registry to resolve block types and children against.
 * @returns The resolved block tree.
 */
export function resolveBlock(raw: unknown, registry: BlockTypeRegistry): ResolvedNode {
  const envelope = AnyBlockConfigSchema.safeParse(raw);
  if (!envelope.success) {
    return { broken: true, type: "?", message: "Not a block: missing or malformed `type`." };
  }

  const type = envelope.data.type;
  const def = registry.get(type);
  if (!def) return { broken: true, type, message: `Unknown block type "${type}".` };

  const parsed = def.configSchema.safeParse(raw);
  if (!parsed.success) {
    return { broken: true, type, message: firstIssue(parsed.error) };
  }

  const config: unknown = parsed.data;
  const deps = new Set<DataSourceKey>(def.getDataDependencies(config));
  const resolvedConfig = resolveValue(def.configSchema, config, registry, deps);

  return {
    def,
    config: resolvedConfig,
    dependencies: [...deps],
  };
}

/** The first validation failure as "path: message", e.g. `url: Invalid URL`. */
function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid config.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
