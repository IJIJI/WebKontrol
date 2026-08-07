import type z from "zod";
import type { TemplateResult } from "lit";
import type { StyleInfo } from "lit/directives/style-map.js";
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
  // ResolvedNode, not ResolvedBlock: a child that fails to resolve sits in the config as a
  // BrokenBlock, so a render fn must go through ctx.renderChild rather than touching child.def.
  [T] extends [BlockSlot]             ? ResolvedNode :
  [T] extends [BlockSlot | undefined] ? ResolvedNode | undefined :  // optional slot
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
 * A block that could not be resolved: an unknown type, or a config its schema rejects. Kept as a
 * node rather than thrown so one bad block renders a placeholder instead of blanking the view.
 */
export interface BrokenBlock {
  readonly broken: true;
  /** The block's `type` as authored, even if it is not a registered key. */
  readonly type: string;
  readonly message: string;
}

export type ResolvedNode<TConfig = unknown> = ResolvedBlock<TConfig> | BrokenBlock;

export function isBroken(node: ResolvedNode): node is BrokenBlock {
  return "broken" in node;
}

/**
 * Everything a block needs to render beyond its own (already resolved) config.
 * Live-data access (bindable value) is backed by a subscription and a lit live directive.
 */
export interface RenderContext {
  renderChild(child: ResolvedNode): TemplateResult;
}

/**
 * Editor-facing presentation of a block type. Travels with the definition (via defineBlock) so
 * plugin blocks bring their own; the registry exposes it through get()/list().
 */
export interface BlockInfo {
  label: string;
  description?: string;
  /** Icon id, resolved via the UI icon registry (absent/unknown ids fall back there). */
  icon?: string;
}

//* Model Registration:
export abstract class AbstractBlockType<TConfig = unknown> {
  abstract readonly key: BlockKey;
  abstract readonly configSchema: z.ZodType<TConfig>;
  abstract readonly info: BlockInfo;

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
   * Produce the *contents* of this block's box as a Lit template. Pure: the same
   * (config, ctx) yields the same result. Children render via ctx.renderChild;
   * they are reached in-place off the resolved config (e.g. config.block).
   *
   * The box itself (and the slot around it) is emitted by the render core, styled from the
   * injected `style` config, so a block never writes its own box.
   */
  abstract render(config: Resolved<TConfig>, ctx: RenderContext): TemplateResult;

  /**
   * Config-driven styles for this block's own box, beyond the universal ones: how it behaves
   * as a container (a grid's tracks, a stack's direction). Structural constants belong in the
   * stylesheet on the block's `wk-` class; only values derived from config belong here.
   */
  boxStyles(_config: Resolved<TConfig>): StyleInfo {
    return {};
  }

  /**
   * Config-driven styles for the *slot* around this block: how it occupies the space its
   * parent gave it (e.g. a spacer's fixed size in a stack). Rare; most blocks fill their slot.
   */
  slotStyles(_config: Resolved<TConfig>): StyleInfo {
    return {};
  }
}
