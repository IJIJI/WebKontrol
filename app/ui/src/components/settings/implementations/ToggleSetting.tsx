import { type JSX } from "react/jsx-runtime";
import { Toggle } from "../../toggle/Toggle";

import "../settings.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

// No inputRef: the row's focus-on-click is an opt-in for controls that take focus, and Toggle's
// switch isn't focusable (no tabIndex), so attaching one would be a silent no-op.
export function ToggleSetting(props: BaseSettingProps<boolean>): JSX.Element {
  return (
    <ValueSetting {...props}>
      {() => (
        <Toggle
          className={"toggleField"}
          checked={props.value}
          setChecked={(checked) => void props.setValue(checked)}
          disabled={props.disabled}
        />
      )}
    </ValueSetting>
  );
}
