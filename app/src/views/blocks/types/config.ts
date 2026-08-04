import z from "zod";
import type { TemplateResult } from "lit";
import { AbstractBlockType, type BlockInfo, type RenderContext, type Resolved } from "./model";
import type { BlockKey, BlockKeyOf, BlockType, DataField, DataKeyOf, DataSourceKey, NamespaceId } from "./schema";
import type { BlockTypeRegistry } from "../registry";

/** The parsed config of a block: the exact `type` key plus its shape fields. */
type BlockConfigOf<K extends BlockKey, S extends z.ZodRawShape> = { type: K } & z.infer<z.ZodObject<S>>;

/**
 * The render function and metadata a block supplies to {@link NamespaceKit.defineBlock}.
 */
export interface BlockImpl<K extends BlockKey, S extends z.ZodRawShape> {
  /** Editor-facing presentation (label/description/icon). */
  info: BlockInfo;
  render: (config: Resolved<BlockConfigOf<K, S>>, ctx: RenderContext) => TemplateResult;
  /** DataSources this block always needs, regardless of config. */
  fixedDataDependencies?: readonly DataSourceKey[];
  /** Helper function to derive needed sources from config (a bound field, or one picked from another field). */
  getConfigDataDependencies?: (config: BlockConfigOf<K, S>) => readonly DataSourceKey[];
}

/** A namespace-bound kit for building a plugin's blocks. See {@link createNamespace}. */
export interface NamespaceKit<N extends NamespaceId> {
  readonly namespace: N;
  blockKey: <const T extends BlockType>(type: T) => BlockKeyOf<N, T>;
  dataKey: <const F extends DataField>(field: F) => DataKeyOf<N, F>;
  defineBlock: <const T extends BlockType, S extends z.ZodRawShape>(
    type: T,
    shape: S,
    impl: BlockImpl<BlockKeyOf<N, T>, S>,
  ) => AbstractBlockType<BlockConfigOf<BlockKeyOf<N, T>, S>>;
  register: (registry: BlockTypeRegistry, blocks: readonly AbstractBlockType<any>[]) => void;
}

/**
 * Build a namespace kit. The namespace is declared once here; every block/data
 * key and every config `type` literal is derived from it, so plugin authors
 * never hardcode (or typo) their namespace.
 *
 * Pure and compile-time only, creating a kit registers nothing. Hand the built
 * blocks to `ns.register(registry, blocks)` to install them.
 *
 * @param namespace - The namespace this plugin owns (e.g. "webkontrol").
 * @returns A kit that mints in-namespace keys and block definitions.
 */
export function createNamespace<const N extends NamespaceId>(namespace: N): NamespaceKit<N> {
  const blockKey = <const T extends BlockType>(type: T): BlockKeyOf<N, T> =>
    `${namespace}::block::${type}`;

  const dataKey = <const F extends DataField>(field: F): DataKeyOf<N, F> =>
    `${namespace}::data::${field}`;

  function defineBlock<const T extends BlockType, S extends z.ZodRawShape>(
    type: T,
    shape: S,
    impl: BlockImpl<BlockKeyOf<N, T>, S>,
  ): AbstractBlockType<BlockConfigOf<BlockKeyOf<N, T>, S>> {
    type Config = BlockConfigOf<BlockKeyOf<N, T>, S>;
    const key = blockKey(type);
    // The `.default(key)` makes `type` optional on input but present on output,
    // so the schema's input type is stricter than Config; hence the assertion.
    const configSchema = z.object({ type: z.literal(key).default(key), ...shape }) as z.ZodType<Config>;

    return new (class extends AbstractBlockType<Config> {
      readonly key = key;
      readonly configSchema = configSchema;
      readonly info = impl.info;
      override readonly fixedDataDependencies = impl.fixedDataDependencies ?? [];

      render(config: Resolved<Config>, ctx: RenderContext): TemplateResult {
        return impl.render(config, ctx);
      }

      protected override _getConfigDataDependencies(config: Config): readonly DataSourceKey[] {
        return impl.getConfigDataDependencies?.(config) ?? [];
      }
    })();
  }

  function register(registry: BlockTypeRegistry, blocks: readonly AbstractBlockType<any>[]): void {
    registry.register(namespace, blocks);
  }

  return { namespace, blockKey, dataKey, defineBlock, register };
}
