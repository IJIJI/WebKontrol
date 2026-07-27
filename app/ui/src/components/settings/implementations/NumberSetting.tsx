import { useRef } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type InputSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";

type NumberProps = InputSettingProps<number> & {
  min?: number;
  max?: number;
  step?: number;
};

export function NumberSetting(props: NumberProps): JSX.Element {
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
        type="number"
        min={props.min}
        max={props.max}
        step={props.step}
        placeholder={props.placeholder}
        ref={inputRef}
        // Show empty rather than NaN when the value is unset.
        value={Number.isFinite(props.value) ? props.value : ""}
        onChange={(event) => {
          props.setValue(event.target.valueAsNumber);
        }}
        disabled={props.disabled}
      />
    </BaseSetting>
  );
}
