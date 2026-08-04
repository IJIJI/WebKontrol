import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./blockSlotSetting.less";
import { BaseSetting } from "../../settings/BaseSetting";
import { Button } from "../../button/Button";
import { FillStyle, Variant } from "../../../common/types/variants";
import { Icons } from "../../icons/Icons";
import { BlockChip } from "../presentation/BlockChip";
import { BlockPicker } from "./BlockPicker";
import { type BlockLike, isBlock } from "../model/blockUtils";

// A newly picked block: just its type. Every other field is optional, defaulted by its schema, or
// filled in by the user — seeding more here would invent config the user didn't ask for.
function newBlock(type: string): BlockLike {
  return { type };
}

/** One block slot: the block that fills it (open / replace / clear), or a button to pick one. */
export function BlockSlotSetting({
  title,
  subtitle,
  value,
  onChange,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  value: unknown;
  onChange: (next: BlockLike | undefined) => void;
  onOpen: () => void;
}): JSX.Element {
  const [picking, setPicking] = useState(false);
  const block = isBlock(value) ? value : undefined;

  return (
    <BaseSetting title={title} subtitle={subtitle}>
      <div className="blockSlot">
        {block ? (
          <>
            <button type="button" className="slotBlock" onClick={onOpen} title="Open this block">
              <BlockChip type={block.type} />
            </button>
            <Button fillStyle={FillStyle.SKELETON} onClick={() => setPicking(true)} ariaLabel="Replace block">
              <Icons.edit size={16} />
            </Button>
            <Button
              fillStyle={FillStyle.SKELETON}
              variant={Variant.DANGER}
              onClick={() => onChange(undefined)}
              ariaLabel="Clear slot"
            >
              <Icons.delete size={16} />
            </Button>
          </>
        ) : (
          <Button fillStyle={FillStyle.FILLED} onClick={() => setPicking(true)}>
            <Icons.add size={16} />
            <span>Pick a block</span>
          </Button>
        )}
      </div>
      <BlockPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(type) => onChange(newBlock(type))}
      />
    </BaseSetting>
  );
}

/** An array of block slots (e.g. a grid's children): reorderable-later list with add and remove. */
export function BlockSlotListSetting({
  title,
  subtitle,
  value,
  onChange,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  value: unknown;
  onChange: (next: unknown[]) => void;
  onOpen: (index: number) => void;
}): JSX.Element {
  const [picking, setPicking] = useState(false);
  const raw: unknown[] = Array.isArray(value) ? value : [];
  // Keep original array indices: a stale config could hold non-block junk between blocks, and
  // open/remove must address the real position, not the filtered one.
  const entries = raw.flatMap((v, index) => (isBlock(v) ? [{ block: v, index }] : []));

  return (
    <BaseSetting title={title} subtitle={subtitle}>
      <div className="blockSlotList">
        {entries.map(({ block, index }) => (
          <div className="slotRow" key={index}>
            <button type="button" className="slotBlock" onClick={() => onOpen(index)} title="Open this block">
              <BlockChip type={block.type} />
            </button>
            <Button
              fillStyle={FillStyle.SKELETON}
              variant={Variant.DANGER}
              onClick={() => onChange(raw.filter((_, j) => j !== index))}
              ariaLabel="Remove block"
            >
              <Icons.delete size={16} />
            </Button>
          </div>
        ))}
        <Button fillStyle={FillStyle.FILLED} onClick={() => setPicking(true)}>
          <Icons.add size={16} />
          <span>Add block</span>
        </Button>
      </div>
      <BlockPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(type) => onChange([...raw, newBlock(type)])}
      />
    </BaseSetting>
  );
}
