import type { AbstractBlockType } from "./types/model";
import { NamespaceIdSchema, type BlockKey, type NamespaceId } from "./types/schema";

/**
 * Shared store of every registered block type, partitioned by the namespace
 * (plugin) that registered it. Lookups use the flat `${namespace}::block::${type}` keyspace
 * and ignore which plugin provided a block; the per-namespace tracking exists so
 * a plugin's blocks can be unregistered on unload.
 */
export class BlockTypeRegistry {
  private readonly _types = new Map<BlockKey, AbstractBlockType<any>>();
  private readonly _keysByNamespace = new Map<NamespaceId, Set<BlockKey>>();

  /**
   * Claim a namespace and register its block types. Atomic: validates the whole
   * batch before mutating. Throws if the namespace is already claimed, a block's
   * key is outside the namespace, or a type is registered twice.
   */
  register(namespace: NamespaceId, blocks: readonly AbstractBlockType<any>[]): void {
    const ns = NamespaceIdSchema.parse(namespace);
    if (this._keysByNamespace.has(ns)) {
      throw new Error(`Namespace "${ns}" is already claimed.`); // TODO: Check if the throwing is correctly caught and does not crash the app if a broken plugin is added. Also check if a plugin is corretly displayed if broken.
    }

    const prefix = `${ns}::block::`;
    const owned = new Set<BlockKey>();
    for (const block of blocks) {
      if (!block.key.startsWith(prefix)) {
        throw new Error(`Block "${block.key}" is not in namespace "${ns}".`);
      }
      if (owned.has(block.key)) {
        throw new Error(`Duplicate block "${block.key}" in the install batch.`);
      }
      if (this._types.has(block.key)) {
        throw new Error(`Block type "${block.key}" is already registered.`);
      }
      owned.add(block.key);
    }

    for (const block of blocks) this._types.set(block.key, block);
    this._keysByNamespace.set(ns, owned);
  }

  /** Remove every block a namespace registered and release the namespace. */
  unregister(namespace: NamespaceId): void {
    const owned = this._keysByNamespace.get(namespace);
    if (!owned) return;
    for (const key of owned) this._types.delete(key);
    this._keysByNamespace.delete(namespace);
  }

  get(key: BlockKey): AbstractBlockType<any> | undefined {
    return this._types.get(key);
  }

  list(): AbstractBlockType<any>[] {
    return [...this._types.values()];
  }
}

export const blockTypeRegistry = new BlockTypeRegistry();
