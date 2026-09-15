import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { SettingWidth } from "../settingWidth";

// Multi-line text. Always the stacked layout: a textarea inside the wide layout's fixed-height
// input row would clip.
export function TextAreaSetting(props: InputSettingProps<string>): JSX.Element {
  return (
    <ValueSetting<string, HTMLTextAreaElement> {...props} width={SettingWidth.COMPACT}>
      {({ changed, inputRef }) => (
        <textarea
          className={"textfield" + (changed ? " changed" : "")}
          placeholder={props.placeholder}
          ref={inputRef}
          rows={4}
          value={props.value}
          onChange={(event) => void props.setValue(event.target.value)}
          disabled={props.disabled}
        />
      )}
    </ValueSetting>
  );
}
