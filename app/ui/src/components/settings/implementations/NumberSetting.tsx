import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

type NumberProps = InputSettingProps<number> & {
  min?: number;
  max?: number;
  step?: number;
};

export function NumberSetting(props: NumberProps): JSX.Element {
  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => (
        <input
          className={"textfield" + (changed ? " changed" : "")}
          type="number"
          min={props.min}
          max={props.max}
          step={props.step}
          placeholder={props.placeholder}
          ref={inputRef}
          // Show empty rather than NaN when the value is unset.
          value={Number.isFinite(props.value) ? props.value : ""}
          onChange={(event) => void props.setValue(event.target.valueAsNumber)}
          disabled={props.disabled}
        />
      )}
    </ValueSetting>
  );
}
