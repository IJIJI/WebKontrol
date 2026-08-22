import { type JSX } from "react/jsx-runtime";
import { Toggle } from "../../toggle/Toggle";

import "../settings.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

// No inputRef, deliberately: the row's focus-on-click is an opt-in, and Toggle opts out (a
// row-click focusing the switch would make the next Space keypress flip it by surprise).
// The switch itself is keyboard-focusable since the a11y pass; only the row assist is declined.
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
