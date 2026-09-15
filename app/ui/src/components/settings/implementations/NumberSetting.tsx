import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

// `number | undefined`, not `number`: a number input has no numeric value while it is empty
// (or mid-typing, e.g. just "-"), and an optional field must be clearable. Emitting undefined
// keeps the stored value in step with what the box shows; emitting NaN would fail validation.
type NumberProps = InputSettingProps<number | undefined> & {
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
          onChange={(event) => {
            const value = event.target.valueAsNumber;
            void props.setValue(Number.isNaN(value) ? undefined : value);
          }}
          disabled={props.disabled}
        />
      )}
    </ValueSetting>
  );
}
