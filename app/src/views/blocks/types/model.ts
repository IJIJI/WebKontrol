import type z from "zod";
import type { TemplateResult } from "lit";
import type { BlockKey, BlockSlot, DataSourceKey } from "./schema";

/**
 * A block config is resolved at runtime into Resolved<T>. It exists to be able to use the runtime output type at compile time.
 * This builds the expected config shape, including the configs of the nested blocks.
 * This exists for code completions while writing the render functions without needing to cast to unkown and the type.
 * The Resolved<T> does not emit code and is erased at compile.
 * 
 * At compile time the Resolve<T> recognises blocks using their brand, at runtime the meta is used for the same purpose.
 * 
 * Branch order matters: a slot is also an object and an array is also an object,
 * so the more specific tests must come first.
 */
export type Resolved<T> =
  [T] extends [BlockSlot]             ? ResolvedBlock :
  [T] extends [BlockSlot | undefined] ? ResolvedBlock | undefined :  // optional slot
  // TODO: add a `| null` mirror branch here if nullable slots are ever needed.
  T extends readonly (infer E)[]      ? ReadonlyArray<Resolved<E>> :
  T extends object                    ? { [K in keyof T]: Resolved<T[K]> } :
  T;

/**
 * The output of the resolver: a validated block whose child slots have been
 * resolved in-place, plus the data sources its subtree depends on.
 *
 * `config` is the parsed config with every child slot replaced by a
 * ResolvedBlock (see Resolved<T>). It is a render-time structure, not the
 * serializable form. The raw pre-resolution config is stored and resolved when needed.
 */
export interface ResolvedBlock<TConfig = unknown> {
  readonly def: AbstractBlockType<TConfig>;
  readonly config: Resolved<TConfig>;
  /** Every DataSource this block and its descendants depend on (deduped). */
  readonly dependencies: readonly DataSourceKey[];
}

/**
 * Everything a block needs to render beyond its own (already resolved) config.
 * Live-data access (bindable value) is backed by a subscription and a lit live directive.
 */
export interface RenderContext {
  renderChild(child: ResolvedBlock): TemplateResult;
}

//* Model Registration:
export abstract class AbstractBlockType<TConfig = unknown> {
  abstract readonly key: BlockKey;
  abstract readonly configSchema: z.ZodType<TConfig>;

  /** DataSources this block always needs, regardless of config. */
  readonly fixedDataDependencies: readonly DataSourceKey[] = [];

  /**
   * All DataSources this block instance depends on: the fixed set plus any
   * derived from config. When the block has more dependencies, depending on its config, 
   * the _getConfigDataDependencies should be overridden in the child.
   */
  getDataDependencies(config: TConfig): readonly DataSourceKey[] {
    return [...new Set([...this.fixedDataDependencies, ...this._getConfigDataDependencies(config)])];
  }

  /**
   * When the block depends on sources derived from config, this needs to be overridden.
   * (e.g. a user-chosen binding, or a source picked based on another field). Defaults to none; 
   * fixed deps are added by getDataDependencies, so only return the extras here.
   */
  protected _getConfigDataDependencies(_config: TConfig): readonly DataSourceKey[] {
    return [];
  }

  /**
   * Produce this block's visual output as a Lit template. Pure: the same
   * (config, ctx) yields the same result. Children render via ctx.renderChild;
   * they are reached in-place off the resolved config (e.g. config.block).
   */
  abstract render(config: Resolved<TConfig>, ctx: RenderContext): TemplateResult;
}
