import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingNonValProps } from "../BaseSetting";
import { useRef } from "react";
import { Button } from "../../button/Button";
import { type Variant, type FillStyle } from "../../../common/variants";

type ButtonSettingProps = BaseSettingNonValProps & {
  onClick: () => void | Promise<void>;
  variant?: Variant;
  fillStyle?: FillStyle;
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
        variant={props.variant}
        fillStyle={props.fillStyle}
      >
        {props.label}
      </Button>
    </BaseSetting>
  );
}
