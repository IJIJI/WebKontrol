import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { type BaseSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { type DisplayName } from "../../../../../src/types/CommonTypes";
import { classNames } from "../../../common/helpers/classNames";

type DisplayNameProps = BaseSettingProps<Partial<DisplayName>>; // TODO: Not partial? Validation is needed in any case.

// Two inputs for one value. No inputRef: with two controls there's no single "the" input for the
// row's focus-on-click to target. The object compare in ValueSetting works here because useDraft
// drops a patch entry that deep-equals its saved value, restoring the original reference.
// TODO: A form field element should have an id or name attribute
export function DisplayNameSetting(props: DisplayNameProps): JSX.Element {
  return (
    <ValueSetting {...props}>
      {({ changed }) => (
        <>
          <span className="inputLabel">Long</span>
          <input
            className={classNames("textfield", changed && "changed")}
            type="text"
            aria-label="Long name"
            value={props.value.long}
            onChange={(event) => void props.setValue({ long: event.target.value, short: props.value.short })}
            disabled={props.disabled}
          />
          <span className="inputLabel">Short</span>
          <input
            className={classNames("textfield", changed && "changed")}
            type="text"
            aria-label="Short name"
            value={props.value.short}
            onChange={(event) => void props.setValue({ long: props.value.long, short: event.target.value })}
            disabled={props.disabled}
          />
        </>
      )}
    </ValueSetting>
  );
}
