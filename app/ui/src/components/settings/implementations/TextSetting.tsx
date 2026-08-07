import { useId } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";

// `suggestions` renders a native datalist under the input: pickable hints, free text stays
// allowed (e.g. font families).
export function TextSetting(props: InputSettingProps<string> & { suggestions?: readonly string[] }): JSX.Element {
  const listId = useId();
  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => (
        <>
          <input
            className={"textfield" + (changed ? " changed" : "")}
            type="text"
            placeholder={props.placeholder}
            ref={inputRef}
            value={props.value}
            onChange={(event) => void props.setValue(event.target.value)}
            disabled={props.disabled}
            list={props.suggestions ? listId : undefined}
          />
          {props.suggestions && (
            <datalist id={listId}>
              {props.suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          )}
        </>
      )}
    </ValueSetting>
  );
}
