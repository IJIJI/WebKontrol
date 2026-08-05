import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

export function TextSetting(props: InputSettingProps<string>): JSX.Element {
  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => (
        <input
          className={"textfield" + (changed ? " changed" : "")}
          type="text"
          placeholder={props.placeholder}
          ref={inputRef}
          value={props.value}
          onChange={(event) => void props.setValue(event.target.value)}
          disabled={props.disabled}
        />
      )}
    </ValueSetting>
  );
}
