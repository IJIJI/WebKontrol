import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingProps } from "../BaseSetting";
import { RestoreButton } from "../RestoreButton";
import { DisplayName } from "../../../../../src/types/CommonTypes";
import { classNames } from "../../../common/helpers/classNames";

type DisplayNameProps = BaseSettingProps<Partial<DisplayName>>; // TODO: Not partial? Validation is needed in any case.

export function DisplayNameSetting(props: DisplayNameProps): JSX.Element {
  // const inputRef = useRef<HTMLInputElement>(null);

  const changed = props.savedVal !== undefined && props.savedVal !== props.value;
  const restore = (): void => {
    if (props.savedVal === undefined) return;
    props.setValue(props.savedVal);
  };
  // TODO: A form field element should have an id or name attribute
  return (
    <BaseSetting {...props} changed={changed}>
      {changed ? <RestoreButton onClick={restore} /> : <></>}
      <span className="inputLabel">Long</span>
      <input
        className={classNames("textfield", changed && "changed")}
        type="text"
        aria-label="Long name"
        value={props.value.long}
        onChange={(event) => {
          props.setValue({long: event.target.value, short: props.value.short });
        }}
        disabled={props.disabled}
      />
      <span className="inputLabel">Short</span>
      <input
        className={classNames("textfield", changed && "changed")}
        type="text"
        aria-label="Short name"
        value={props.value.short}
        onChange={(event) => {
          props.setValue({long: props.value.long, short: event.target.value });
        }}
        disabled={props.disabled}
      />
    </BaseSetting>
  );
}
