import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import { BaseSetting, type BaseSettingNonValProps } from "../BaseSetting";
import { useRef } from "react";
import { Button, type ButtonStyle, type ButtonType } from "../../button/Button";

type ButtonSettingProps = BaseSettingNonValProps & {
  onClick: () => void | Promise<void>;
  type?: ButtonType;
  style?: ButtonStyle;
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
