import z from "zod";
import type { TemplateResult } from "lit";
import type { StyleInfo } from "lit/directives/style-map.js";
import { AbstractBlockType, type BlockInfo, type RenderContext, type Resolved } from "./model";
import { blockStyleSchema, type BlockKey, type BlockKeyOf, type BlockStyle, type BlockType, type DataField, type DataKeyOf, type DataSourceKey, type NamespaceId } from "./schema";
import type { BlockTypeRegistry } from "../registry";
import type { FieldMeta } from "../../types/schema";

/** The parsed config of a block: the exact `type` key, the injected `disabled` and box `style`, plus its shape fields. */
type BlockConfigOf<K extends BlockKey, S extends z.ZodRawShape> = { type: K; disabled: boolean; style: BlockStyle } & z.infer<z.ZodObject<S>>;

/**
 * The render function and metadata a block supplies to {@link NamespaceKit.defineBlock}.
 */
export interface BlockImpl<K extends BlockKey, S extends z.ZodRawShape> {
  /** Editor-facing presentation (label/description/icon). */
  info: BlockInfo;
  render: (config: Resolved<BlockConfigOf<K, S>>, ctx: RenderContext) => TemplateResult;
  /**
   * How this block sizes when nothing is set, on both axes. Present = it has an intrinsic
   * content size worth hugging (text, an image); absent = it has none, so it fills (a website
   * or a grid would collapse to nothing if it hugged).
   *
   * A default, not a capability: every block gets the full size group either way, since a
   * length is meaningful on all of them and gating would only be a list to curate.
   * TODO: per-axis defaults, the mixed cases (fill one, hug the other) are often what is
   * wanted and this single value cannot say them. See the backlog.
   */
  box?: { sizing: "container" | "content" };
  /** Config-driven styles for this block's own box. See {@link AbstractBlockType.boxStyles}. */
  boxStyles?: (config: Resolved<BlockConfigOf<K, S>>) => StyleInfo;
  /** Config-driven styles for the slot around this block. See {@link AbstractBlockType.slotStyles}. */
  slotStyles?: (config: Resolved<BlockConfigOf<K, S>>) => StyleInfo;
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
    // `style` is the framework-injected universal box (see blockStyleSchema): every block is
    // styleable without declaring anything. Last in the object so the editor shows a block's
    // own fields first, the style section after (schema order drives the form).
    if ("style" in shape) throw new Error(`Block "${key}" declares a "style" field; the framework injects it (use BlockImpl.box to configure).`);
    if ("disabled" in shape) throw new Error(`Block "${key}" declares a "disabled" field; the framework injects it.`);
    const configSchema = z.object({
      type: z.literal(key).default(key),
      // Also framework-injected, and first in the form: it decides whether the fields under it
      // matter at all. Defaulted rather than optional so every block answers the question.
      // The resolver leaves a disabled block out of the tree entirely (see isDisabledBlock).
      disabled: z.boolean().default(false).meta({
        label: "Disabled",
        description: "Keep the block in the view's config, but leave it out of the view",
      } satisfies FieldMeta),
      ...shape,
      style: blockStyleSchema(impl.box?.sizing),
    }) as z.ZodType<Config>;

    return new (class extends AbstractBlockType<Config> {
      readonly key = key;
      readonly configSchema = configSchema;
      readonly info = impl.info;
      override readonly fixedDataDependencies = impl.fixedDataDependencies ?? [];

      render(config: Resolved<Config>, ctx: RenderContext): TemplateResult {
        return impl.render(config, ctx);
      }

      override boxStyles(config: Resolved<Config>): StyleInfo {
        return impl.boxStyles?.(config) ?? {};
      }

      override slotStyles(config: Resolved<Config>): StyleInfo {
        return impl.slotStyles?.(config) ?? {};
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
