import { useRef, type RefObject } from "react";
import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { BaseSetting, type BaseSettingProps } from "./BaseSetting";
import { RestoreButton } from "./RestoreButton";

// Shared shell for single-value settings: computes the changed state, shows the restore button,
// and owns the ref BaseSetting focuses on row click. The concrete control renders via the child
// function, which receives that state — implementations then differ only in their control.
// `E` is the control's element type (input, select, …).
//
// A function child rather than a plain node because both values originate here: `inputRef` must
// be attached by the control, and `changed` styles it. Attaching the ref is optional and means
// "focus me when the row is clicked", controls that don't take focus (Toggle) just ignore it.
export function ValueSetting<T, E extends HTMLElement = HTMLInputElement>({
  children,
  ...props
}: BaseSettingProps<T> & {
  children: (args: { changed: boolean; inputRef: RefObject<E | null> }) => JSX.Element;
}): JSX.Element {
  const inputRef = useRef<E>(null);

  // Fields with no saved value (a new entity) never mark changed: restoring them would mean
  // "back to unset", which the coerced inputs can't display honestly. Unsaved-new is signalled
  // at the block level instead (the tree's unsaved outline).
  const changed = props.savedVal !== undefined && props.savedVal !== props.value;
  const restore = (): void => {
    if (props.savedVal === undefined) return;
    void props.setValue(props.savedVal);
  };

  return (
    <BaseSetting {...props} changed={changed} inputRef={inputRef}>
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      {children({ changed, inputRef })}
    </BaseSetting>
  );
}
