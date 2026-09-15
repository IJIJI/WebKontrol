// The admin's single entry point to the block registry. Importing the built-in namespace here
// (for its registration side effect) means no UI module can observe an empty registry. Everything
// block-related imports the registry from this file, never from src/ directly.
import "../../../../../src/views/blocks/namespaces/webkontrol";

import { blockTypeRegistry } from "../../../../../src/views/blocks/registry";
import type { AbstractBlockType, BlockInfo } from "../../../../../src/views/blocks/types/model";
import type { BlockKey } from "../../../../../src/views/blocks/types/schema";

export { blockTypeRegistry };

/** The registered definition for a block type key, if any (unknown/stale keys miss). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry entries are heterogenous; config typing is per-block.
export function blockDef(type: string): AbstractBlockType<any> | undefined {
  return blockTypeRegistry.get(type as BlockKey);
}

/** A block type's presentation info, undefined for unregistered types. */
export function blockInfo(type: string): BlockInfo | undefined {
  return blockDef(type)?.info;
}
