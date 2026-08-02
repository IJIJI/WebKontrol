import { useContext } from "react";
import { type JSX } from "react/jsx-runtime";

import "./settings.less";
import { SettingWidth, SettingWidthContext } from "./settingWidth";
import { classNames } from "../../common/helpers/classNames";

export type BaseSettingsCompProps = {
  title: string;
  subtitle?: string;
  inputRef?: React.RefObject<any>;
  children: JSX.Element | JSX.Element[];
  changed?: boolean;
  // Layout of label vs. input. Falls back to the nearest SettingWidthContext, then WIDE.
  width?: SettingWidth;
};

export type BaseSettingNonValProps = Omit<
  BaseSettingsCompProps,
  "inputRef" | "children" | "changed"
> & {
  disabled?: boolean;
};

export type BaseSettingProps<T = any> = BaseSettingNonValProps & {
  value: T;
  setValue: (value: T) => void | Promise<void>;
  savedVal?: T;
};

// For free-text-style inputs (text/url/number) that support a placeholder. Kept off
// BaseSettingProps since toggles/selects/buttons have no placeholder.
export type InputSettingProps<T> = BaseSettingProps<T> & { placeholder?: string };

// TODO: Add an easy way to add an InfoPill
export function BaseSetting(props: BaseSettingsCompProps): JSX.Element {
  const contextWidth = useContext(SettingWidthContext);
  const width = props.width ?? contextWidth ?? SettingWidth.WIDE;
  return (
    <div
      className={classNames("setting", "field", width, props.changed && "changed")}
      onClick={() => {
        if (props.inputRef) props.inputRef.current?.focus();
      }}
    >
      <div className="titletext">
        <span className="title">{props.title}</span>
        {props.subtitle && <span className="subtitle">{props.subtitle}</span>}
      </div>
      <div className="input">{props.children}</div>
    </div>
  );
}
