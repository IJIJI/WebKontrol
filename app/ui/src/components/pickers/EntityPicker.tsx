import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import { Modal, ModalSize } from "../modal/Modal";
import { Collection } from "../collections/Collection";
import { CollectionLayout, type CollectionItemProps } from "../collections/types";
import { Button } from "../button/Button";
import { Variant, FillStyle } from "../../helpers/variants";

// A modal that presents a grid of entities to pick one from, then confirm. Generic over the entity
// type; `renderCard` maps an entity to its card (icon/title/chips). Shared by every "pick an X"
// flow (assign a view to a puppet, pick a view for a puppet, …).
export function EntityPicker<T>({
  open,
  onClose,
  title,
  size = ModalSize.SM,
  items,
  getKey,
  renderCard,
  onConfirm,
  confirmLabel = "Select",
  empty,
  multiple = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => CollectionItemProps;
  onConfirm: (item: T[]) => void | Promise<void>;
  confirmLabel?: string;
  empty?: ReactNode;
  multiple?: boolean;
}): JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const selectToggle = useCallback((key: string): void => {
    setSelectedKeys((prevKeys) => {
      if (!multiple)
        return new Set([key]);

      const nextKeys = new Set(prevKeys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      return nextKeys;
    });
  }, []);

  const isSelected = (key: string) => selectedKeys.has(key);

  useEffect(() => {
    if (open) {
      setSelectedKeys(new Set());
    }
  }, [open]);

  const selected = items.filter( (item) => selectedKeys.has(getKey(item)) );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <Button fillStyle={FillStyle.SKELETON} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={Variant.ACCENT}
            disabled={selected === null}
            onClick={() => {
              if (selected === null) return;
              void onConfirm(selected);
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Collection
        items={items}
        getKey={getKey}
        layout={CollectionLayout.GRID}
        empty={empty}
        renderItem={(item) => {
          const key = getKey(item);
          return { ...renderCard(item), selected: isSelected(key), onSelect: () => selectToggle(key) };
        }}
      />
    </Modal>
  );
}
