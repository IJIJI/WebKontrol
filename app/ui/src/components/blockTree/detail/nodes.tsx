import { type JSX } from "react/jsx-runtime";

import { type ConfigValue, classify, summaryToken } from "../model/configValue";
import { type BlockLike, isBlock } from "../model/blockUtils";
import { BlockChip } from "../presentation/BlockChip";
import { useDisclosure, Caret } from "./disclosure";
import { useSelect } from "./selectContext";
import { inlineValue } from "./inlineValue";

// The recursive family that renders a block's config: a field is an inline value or a collapsible
// group; an array element is a block ref, an expandable wrapper, or a scalar. Kept in one module
// because they are mutually recursive. only `Field` is needed from outside.

// An array element that is an object. Its single block field (if any) is the "main" field: it
// becomes the clickable headline, the rest fold behind a summary and expand to labelled rows. With
// no single block field there is no headline, the whole thing expands from its summary.
function WrapperItem({
  entries,
  depth,
}: {
  entries: [string, unknown][];
  depth: number;
}): JSX.Element {
  const select = useSelect();
  const { open, toggle } = useDisclosure(false);
  const blockEntries = entries.filter(([, v]) => isBlock(v));
  const mainEntry = blockEntries.length === 1 ? blockEntries[0] : null;
  const mainBlock = mainEntry === null ? null : (mainEntry[1] as BlockLike);
  const restEntries = mainEntry === null ? entries : entries.filter((e) => e !== mainEntry);
  const expandable = restEntries.length > 0;
  const summary =
    mainEntry === null
      ? entries.map(([k, v]) => `${k}: ${summaryToken(v)}`).join(" · ")
      : restEntries.map(([, v]) => summaryToken(v)).join(" · ");

  return (
    <div className="wrapItem">
      <div className="wrapHead">
        {mainBlock !== null && <BlockChip type={mainBlock.type} onClick={() => select(mainBlock)} />}
        {expandable && (
          <button
            type="button"
            className="wrapToggle"
            aria-label="Toggle fields"
            aria-expanded={open}
            onClick={toggle}
          >
            {!open && summary && <span className="wrapSummary">{summary}</span>}
            <Caret open={open} />
          </button>
        )}
      </div>
      {open && (
        <div className="wrapBody">
          {restEntries.map(([k, v]) => (
            <Field key={k} name={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// One element of an array, at the array's own level (no index): a block chip, an expandable wrapper
// object, or a plain scalar/inline value.
function ArrayItem({ el, depth }: { el: unknown; depth: number }): JSX.Element {
  const select = useSelect();
  const cv = classify(el);
  if (cv.kind === "block") {
    const { block } = cv;
    return (
      <div className="sub">
        <BlockChip type={block.type} onClick={() => select(block)} />
      </div>
    );
  }
  if (cv.kind === "object") {
    return <WrapperItem entries={cv.entries} depth={depth} />;
  }
  return (
    <div className="sub">
      <span className="scalar">{summaryToken(el)}</span>
    </div>
  );
}

// A collapsible group (object or array), keyed by its field name. First-level groups open by
// default; deeper ones start collapsed. Array items sit at the array's own level (no index);
// object fields are indented one step.
function Group({
  name,
  cv,
  depth,
}: {
  name: string;
  cv: Extract<ConfigValue, { kind: "array" | "object" }>;
  depth: number;
}): JSX.Element {
  const { open, toggle } = useDisclosure(depth === 0);
  const isArray = cv.kind === "array";
  const count = isArray ? cv.items.length : cv.entries.length;
  const unit = isArray ? (count === 1 ? "item" : "items") : count === 1 ? "field" : "fields";

  return (
    <div className="group">
      <button type="button" className="groupHead" aria-expanded={open} onClick={toggle}>
        <span className="fieldKey">{name}</span>
        <Caret open={open} />
        {!open && <span className="groupCount">{count} {unit}</span>}
      </button>
      {open && (
        <div className={isArray ? "groupBody flat" : "groupBody"}>
          {isArray
            ? cv.items.map((el, i) => <ArrayItem key={i} el={el} depth={depth} />)
            : cv.entries.map(([k, v]) => <Field key={k} name={k} value={v} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

// One field: a labelled inline value, or a collapsible group.
export function Field({
  name,
  value,
  depth,
}: {
  name: string;
  value: unknown;
  depth: number;
}): JSX.Element {
  const select = useSelect();
  const cv = classify(value);
  if (cv.kind === "array" || cv.kind === "object") {
    return <Group name={name} cv={cv} depth={depth} />;
  }
  return (
    <div className="fieldRow">
      <span className="fieldKey">{name}</span>
      <span className="fieldVal">{inlineValue(cv, select)}</span>
    </div>
  );
}
