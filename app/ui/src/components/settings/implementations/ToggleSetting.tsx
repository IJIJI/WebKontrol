import { JSX } from "react/jsx-runtime";
import { Toggle } from "../../toggle/Toggle";

import "../settings.less";

import { BaseSetting } from "../BaseSetting";
import { useRef } from "react";

export function ToggleSetting({title, subtitle, value, setValue, disabled}: {title: string, subtitle: string, value: boolean, setValue: (value: boolean) => void | Promise<void>, disabled?: boolean}): JSX.Element {
  const inputRef = useRef<HTMLDivElement>(null);

  return (
    <BaseSetting inputRef={inputRef} title={title} subtitle={subtitle}>
        <Toggle ref={inputRef} checked={value} setChecked={setValue} disabled={disabled} />
    </BaseSetting>
  );

}