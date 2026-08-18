import type { Release } from "./model";

/**
 * An update as data: the pure half of the runner split. planUpdate() decides *what*
 * happens in which order, the runner owns *how* (paths, processes, filesystem), so the
 * ordering rules live here where an assert-check can hold them down without any I/O.
 * Whether the swap is allowed at all (allowlist, downgrade gate) is the manager's call,
 * made before this is ever built.
 */
export type UpdateStep =
  | { kind: "clean-staging" }
  | { kind: "download"; url: string }
  | { kind: "extract" }
  | { kind: "install-deps" }
  | { kind: "snapshot-db" }
  | { kind: "write-pending"; from: string; to: string }
  | { kind: "activate"; version: string } // repoint the `current` file, temp+rename
  | { kind: "adopt-supervisor"; version: string } // best-effort copy, keeps .prev
  | { kind: "sweep-releases"; keep: string[] };

export interface PlanInput {
  from: string; // the running version
  to: Release;
  /** releases/<to>/ already on disk: a downgrade to a kept release skips the fetch half. */
  targetPresent: boolean;
}

export function planUpdate(input: PlanInput): UpdateStep[] {
  const fetch: UpdateStep[] = input.targetPresent
    ? []
    : [
        { kind: "clean-staging" },
        { kind: "download", url: input.to.assetUrl },
        { kind: "extract" },
        { kind: "install-deps" },
      ];
  return [
    ...fetch,
    // Snapshot and pending-marker strictly before the repoint: from the moment `current`
    // names the new release, a crash must find everything rollback needs already on disk.
    { kind: "snapshot-db" },
    { kind: "write-pending", from: input.from, to: input.to.version },
    { kind: "activate", version: input.to.version },
    { kind: "adopt-supervisor", version: input.to.version },
    { kind: "sweep-releases", keep: [input.to.version, input.from] },
  ];
}
