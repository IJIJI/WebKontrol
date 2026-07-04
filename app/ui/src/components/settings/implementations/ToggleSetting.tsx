import { type JSX } from "react/jsx-runtime";
import { Toggle } from "../../toggle/Toggle";

import "../settings.less";

import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { useRef } from "react";

type ToggleProps = BaseSettingProps<boolean>;

export function ToggleSetting(props: ToggleProps): JSX.Element {
  const inputRef = useRef<HTMLDivElement>(null);

  return (
    <BaseSetting {...props} inputRef={inputRef}>
      <Toggle
        ref={inputRef}
        checked={props.value}
        setChecked={props.setValue}
        disabled={props.disabled}
      />
    </BaseSetting>
  );
}
