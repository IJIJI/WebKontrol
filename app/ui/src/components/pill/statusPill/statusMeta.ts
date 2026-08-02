import { ConnectionState } from "../../../../../src/types/CommonTypes";
import { Variant, FillStyle } from "../../../common/types/variants";

// The single source for how a ConnectionState renders: pill variant/fill + its default label.
// Shared by StatusPill and (per-row) GroupStatusPill.
export const STATUS_META: Record<ConnectionState, { variant: Variant; fillStyle: FillStyle; label: string }> = {
  [ConnectionState.DISABLED]: { variant: Variant.DEFAULT, fillStyle: FillStyle.FILLED, label: "Disabled" },
  [ConnectionState.ERROR]: { variant: Variant.WARNING, fillStyle: FillStyle.FILLED, label: "Error" },
  [ConnectionState.FAILED]: { variant: Variant.DANGER, fillStyle: FillStyle.FILLED, label: "Failed" },
  [ConnectionState.OFFLINE]: { variant: Variant.WARNING, fillStyle: FillStyle.FILLED, label: "Offline" },
  [ConnectionState.ONLINE]: { variant: Variant.SUCCESS, fillStyle: FillStyle.FILLED, label: "Online" },
  [ConnectionState.UNKNOWN]: { variant: Variant.WARNING, fillStyle: FillStyle.FILLED, label: "Unknown" },
};
