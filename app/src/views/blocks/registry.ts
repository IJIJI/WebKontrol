import { type BlockKey, type BlockTypeDefinition } from "./types/schema";


export class BlockTypeRegistry { // TODO: BlockRegistry?
  private _types = new Map<BlockKey, BlockTypeDefinition>();

  register(definition: BlockTypeDefinition): void {
    if (this._types.has(definition.key)) {
      throw new Error(`Block type with key: "${definition.key}" is already registered.`);
    }
    this._types.set(definition.key, definition);
  }
  get(key: BlockKey): BlockTypeDefinition | undefined { // TODO: Null instead of undefined?
    return this._types.get(key);
  }
  list(): BlockTypeDefinition[] {
    return [...this._types.values()];
  }
}