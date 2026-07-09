import type z from "zod";
import type { BlockKey, DataSourceKey } from "./schema";

//* Resolved Blocks:
export interface ResolvedBlock<TConfig = unknown> { // TODO: Move to registry types?
  type: BlockKey,
  config: TConfig,
}

//* Model Registration:
export abstract class AbstractBlockType<TConfig> {
  abstract readonly key: BlockKey;
  abstract readonly configSchema: z.ZodType<TConfig>;
  readonly fixedDataDependencies: DataSourceKey[] = [];

  resolveDirect(config: TConfig): string | undefined { // TODO: Right return type? Right name?
    return undefined;
  }
}