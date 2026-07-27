import { type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./detailList.less";
import { CopyButton } from "../copyButton/CopyButton";

export interface DetailRow {
  label: string;
  value: ReactNode;
  copy?: string; // when set, a copy button copies this string
}

// A quiet, read-only section: an uppercase title over a bordered list of label -> value rows,
// each optionally copyable. Reusable for any entity's detail page (views, puppets, ...).
export function DetailList({ title, rows }: { title?: string; rows: DetailRow[] }): JSX.Element {
  return (
    <section className="detailList">
      {title != null && <span className="sectionLabel">{title}</span>}
      <div className="rows">
        {rows.map((row) => (
          <div key={row.label} className="detailRow">
            <span className="rowLabel">{row.label}</span>
            <div className="rowValue">
              <span className="value">{row.value}</span>
              {row.copy != null && <CopyButton text={row.copy} label={`Copy ${row.label}`} />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
