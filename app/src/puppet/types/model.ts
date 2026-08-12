import type { ConnectionState } from "../../types/CommonTypes";
import type { BasePuppetConfig, NavigationRequest, PuppetRuntime } from "./schema";
import type { EntityAppearance } from "../../common/entityAppearance/schema";

/**
 * This file contains all model definitions for the puppets. That means types that don't need validation.
 * Those are types that are internally created, and can be blindly trusted to be valid.
 */

// Puppet's navigation info: What was requested
export enum NavigationState {
  IDLE = "Idle",       // nothing asked for yet; only ever the initial state
  LOADING = "Loading",
  LOADED = "Loaded",
  FAILED = "Failed",
}

/**
 * Why a navigation failed, in terms a caller can act on.
 * The message says what happened; this says what kind of thing it was.
 */
export enum NavigationFailure {
  TIMEOUT = "Timeout",   // Did not finish within load_timeout.
  NETWORK = "Network",   // Never reached a server: DNS, refused, unreachable.
  STATUS = "Status",     // Reached one, it answered with an error. See `status`.
  PUPPET = "Puppet",     // The driver broke, nothing to do with the target.
  UNKNOWN = "Unknown",
}

/**
 * A failure whose kind the thrower already knew, so classification never has to
 * recognise a driver's own throws by their message text. Lives with the model rather
 * than a driver because AbstractPuppet reads `status` off it when recording a failure.
 */
export class KnownFailure extends Error {
  constructor(
    readonly kind: NavigationFailure,
    message: string,
    readonly status?: number, // HTTP code, STATUS kind only
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/**
 * The record of the most recent navigation. Nothing clears it, it gets superseded:
 * a FAILED entry stays until a newer navigation overwrites it, because the display
 * genuinely still shows that failure.
 *
 * A union so the impossible combinations (LOADED with an error, FAILED without one,
 * LOADING without a request) do not compile.
 */
export type NavigationInfo =
  | { state: NavigationState.IDLE; moment: number }
  | { state: NavigationState.LOADING; request: NavigationRequest; moment: number }
  | { state: NavigationState.LOADED; request: NavigationRequest; moment: number }
  | {
      state: NavigationState.FAILED;
      request: NavigationRequest;
      failure: NavigationFailure;
      error: string;
      status?: number; // HTTP code, present when failure is STATUS
      moment: number;
    };

// Puppet's target info: What was loaded
export type OgTargetInfo = {
  title?: string;
  description?: string;
  image?: string;
};

export type TargetInfo = {
  title?: string;
  description?: string;
  og?: OgTargetInfo;
  url?: string;
  screenshot?: string;
};

export interface PuppetInfo {
  state: ConnectionState;
  error?: string; // Why it is not ONLINE. Absent while healthy.
  navigation: NavigationInfo;
  target_info?: TargetInfo;
  moment: number;
}


export interface PuppetDataBundle {
  runtime: PuppetRuntime;
  info: PuppetInfo;
  config: BasePuppetConfig;
  appearance: EntityAppearance;
}