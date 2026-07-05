import { useRef } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";

type TextProps = BaseSettingProps<string>;

export function TextSetting(props: TextProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const changed = props.savedVal !== undefined && props.savedVal !== props.value;
  const restore = (): void => {
    if (props.savedVal === undefined) return;
    props.setValue(props.savedVal);
  };

  return (
    <BaseSetting {...props} changed={changed} inputRef={inputRef}>
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      <input
        className={"textfield" + (changed ? " changed" : "")}
        type="text"
        ref={inputRef}
        value={props.value}
        onChange={(event) => {
          props.setValue(event.target.value);
        }}
        disabled={props.disabled}
      />
    </BaseSetting>
  );
}
