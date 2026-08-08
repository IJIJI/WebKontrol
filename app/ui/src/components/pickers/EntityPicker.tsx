import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { type JSX } from "react/jsx-runtime";

import "./entityPicker.less";
import { Modal, ModalSize } from "../modal/Modal";
import { Collection } from "../collections/Collection";
import { CollectionLayout, type CollectionItemProps } from "../collections/types";
import { Button } from "../button/Button";
import { Variant, FillStyle } from "../../common/types/variants";
import { classNames } from "../../common/helpers/classNames";

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
  searchText,
  layout = CollectionLayout.GRID,
  fixedSize = false,
  header,
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
  // When set, a search field filters the grid by this text (case-insensitive substring).
  searchText?: (item: T) => string;
  layout?: CollectionLayout;
  // Pin the body height (scrolling inside) so filtering/content changes never resize the modal.
  fixedSize?: boolean;
  // Pinned above the search: actions that aren't one of the items and shouldn't be filtered out
  // by a search (e.g. "paste what you copied"). Acts immediately rather than needing Confirm.
  header?: ReactNode;
}): JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

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
  }, [multiple]);

  const isSelected = (key: string) => selectedKeys.has(key);

  useEffect(() => {
    if (open) {
      setSelectedKeys(new Set());
      setQuery("");
    }
  }, [open]);

  // Selection is applied over ALL items, so a selected item filtered out of view stays selected.
  const selected = items.filter( (item) => selectedKeys.has(getKey(item)) );

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => (q && searchText ? items.filter((item) => searchText(item).toLowerCase().includes(q)) : items),
    [items, q, searchText],
  );

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
      <div className={classNames("entityPicker", fixedSize && "fixedSize")}>
        {header}
        {searchText && (
          <input
            type="text"
            className="textfield"
            placeholder="Search…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        <Collection
          items={shown}
          getKey={getKey}
          layout={layout}
          empty={empty}
          renderItem={(item) => {
            const key = getKey(item);
            return { ...renderCard(item), selected: isSelected(key), onSelect: () => selectToggle(key) };
          }}
        />
      </div>
    </Modal>
  );
}
