import z from "zod";
import { AbstractBlockType } from "./model";
import type { BlockType, DataField, NamespaceId } from "./schema";
import type { BlockTypeRegistry } from "../registry";

/**
 * A factory method for a namespace-kit that helps building a plugin's blocks within that namespace.
 * The namespace key is declared here and all declared blocks and (todo) data keys are assigned the correct namespace.
 * 
 * @param namespace The namespace key. e.g. webkontrol, or webkontrol.visuals
 * @returns // TODO
 */
export function createNamespace<const N extends NamespaceId>(namespace: N) {
  const blockKey = <const T extends BlockType>(type: T) =>
    `${namespace}::block::${type}` as `${N}::block::${T}`;

  const dataKey = <const F extends DataField>(field: F) =>
    `${namespace}::data::${field}` as `${N}::data::${F}`;

  /**
   * Build a block base class with its key and config schema pre-wired. Extend it
   * and implement render(); the config `type` literal is baked into the schema
   * and TConfig is inferred from `shape`, so nothing else is restated.
   */
  function Block<const T extends BlockType, S extends z.ZodRawShape>(type: T, shape: S) {
    const key = blockKey(type);
    const configSchema = z.object({ type: z.literal(key).default(key), ...shape });

    abstract class BlockBase extends AbstractBlockType<z.infer<typeof configSchema>> {
      readonly key = key;
      readonly configSchema = configSchema;
    }
    return BlockBase;
  }

  /** Install this namespace's blocks into a registry (delegates to registry.register). */
  function register(registry: BlockTypeRegistry, blocks: readonly AbstractBlockType<any>[]): void {
    registry.register(namespace, blocks);
  }

  return { namespace, blockKey, dataKey, Block, register };
}
