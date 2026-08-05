import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "./blockSlotSetting.less";
import { BaseSetting } from "../../settings/BaseSetting";
import { SettingWidth } from "../../settings/settingWidth";
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

/** One block slot: the block that fills it (open / clear), or a button to pick one. */
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
    <BaseSetting title={title} subtitle={subtitle} width={SettingWidth.AUTO}>
      <div className="blockSlot">
        {block ? (
          <>
            <button type="button" className="slotBlock" onClick={onOpen} title="Open this block">
              <BlockChip type={block.type} />
            </button>
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

/** An array of block slots (e.g. a grid's children): a column of entry rows with add and remove. */
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
    // COMPACT (not AUTO): the row list needs auto height, which the wide layout's fixed-height
    // input row would clip.
    <BaseSetting title={title} subtitle={subtitle} width={SettingWidth.COMPACT}>
      <div className="blockSlotList">
        {entries.map(({ block, index }) => (
          <span className="slotEntry" key={index}>
            <button type="button" className="slotBlock" onClick={() => onOpen(index)} title="Open this block">
              <BlockChip type={block.type} />
            </button>
            <Button
              fillStyle={FillStyle.SKELETON}
              variant={Variant.DANGER}
              onClick={() => onChange(raw.filter((_, j) => j !== index))}
              ariaLabel="Remove block"
            >
              {/* Trash, not a cross: removing an entry deletes the block's config subtree. The
                  cross is reserved for non-destructive dismissals (closing panes/modals). */}
              <Icons.delete size={14} />
            </Button>
          </span>
        ))}
        <Button fillStyle={FillStyle.FILLED} onClick={() => setPicking(true)} ariaLabel="Add block">
          <Icons.add size={16} />
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
