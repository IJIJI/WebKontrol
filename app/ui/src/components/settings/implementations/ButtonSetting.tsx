import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingNonValProps } from "../BaseSetting";
import { useRef } from "react";
import { Button } from "../../button/Button";
import { type Variant, type FillStyle } from "../../../helpers/variants";

type ButtonSettingProps = BaseSettingNonValProps & {
  onClick: () => void | Promise<void>;
  type?: Variant;
  style?: FillStyle;
  label: string;
};


export function ButtonSetting(props: ButtonSettingProps): JSX.Element {

  const inputRef = useRef<HTMLButtonElement>(null);

  return (
    <BaseSetting {...props} inputRef={inputRef}>
      <Button 
        onClick={props.onClick} 
        size={14}
        disabled={props.disabled}
        ref={inputRef}
        type={props.type}
        style={props.style}
      >
        {props.label}
      </Button>
    </BaseSetting>
  );
}
