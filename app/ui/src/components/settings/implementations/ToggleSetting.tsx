import { type JSX } from "react/jsx-runtime";
import { Toggle } from "../../toggle/Toggle";

import "../settings.less";

import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { useRef } from "react";
import { RestoreButton } from "../RestoreButton";

type ToggleProps = BaseSettingProps<boolean>;

export function ToggleSetting(props: ToggleProps): JSX.Element {
  const inputRef = useRef<HTMLDivElement>(null);

  const changed = props.savedVal !== undefined && props.savedVal !== props.value;
  const restore = (): void => { // TODO: Does this need a restore button?
    if (props.savedVal === undefined) return;
    props.setValue(props.savedVal);
  };

  return (
    <BaseSetting {...props} changed={changed} inputRef={inputRef}>
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      <Toggle
        ref={inputRef}
        className={"toggleField"}
        checked={props.value}
        setChecked={props.setValue}
        disabled={props.disabled}
      />
    </BaseSetting>
  );
}
