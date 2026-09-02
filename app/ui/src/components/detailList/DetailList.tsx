import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./detailList.less";
import { SettingGroup } from "../settings/SettingGroup";
import { CopyButton } from "../copyButton/CopyButton";

export interface DetailRow {
  label: string;
  value: ReactNode;
  copy?: string; // when set, a copy button copies this string
}

// A compact read-only detail section: one card of label -> value rows under a SettingGroup label,
// so it stays uniform with the Settings pages without a card per row. Reusable across entities.
export function DetailList({ title, rows }: { title: string; rows: DetailRow[] }): JSX.Element {
  return (
    <SettingGroup title={title}>
      <div className="detailRows">
        {rows.map((row) => (
          <div key={row.label} className="detailRow">
            <span className="rowLabel">{row.label}</span>
            <div className="rowValue">
              <span className="detailValue">{row.value}</span>
              {row.copy != null && <CopyButton text={row.copy} label={`Copy ${row.label}`} />}
            </div>
          </div>
        ))}
      </div>
    </SettingGroup>
  );
}
