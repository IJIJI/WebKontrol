import type { AbstractBlockType } from "./types/model";
import { type BlockKey } from "./types/schema";


export class BlockTypeRegistry {
  private _types = new Map<BlockKey, AbstractBlockType<any>>();

  register(definition: AbstractBlockType<any>): void {
    if (this._types.has(definition.key)) {
      throw new Error(`Block type with key: "${definition.key}" is already registered.`);
    }
    this._types.set(definition.key, definition);
  }
  get(key: BlockKey): AbstractBlockType<any> | undefined {
    return this._types.get(key);
  }
  list(): AbstractBlockType<any>[] {
    return [...this._types.values()];
  }
}

export const blockTypeRegistry = new BlockTypeRegistry();