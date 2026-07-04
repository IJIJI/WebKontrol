import { useRef } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";

type TextProps = BaseSettingProps<string>;

export function TextSetting(props: TextProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <BaseSetting {...props} inputRef={inputRef}>
      {props.changed ? <RestoreButton onClick={() => {alert("undo not implemented yet...")}} /> : <></>}
      <input
        className="textfield"
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
