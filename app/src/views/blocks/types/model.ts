import type { BlockKey } from "./schema";

//* Resolved Blocks:
export interface ResolvedBlock<TConfig = unknown> { // TODO: Move to registry types?
  type: BlockKey,
  config: TConfig,
}