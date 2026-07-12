import { type JSX } from "react/jsx-runtime";

import "./settings.less";

export type BaseSettingsCompProps = {
  title: string;
  subtitle: string;
  inputRef?: React.RefObject<any>;
  children: JSX.Element | JSX.Element[];
  changed?: boolean;
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

// TODO: Add an easy way to add an InfoPill
export function BaseSetting(props: BaseSettingsCompProps): JSX.Element {
  return (
    <div
      className={"setting field" + (props.changed ? " changed" : "")}
      onClick={() => {
        if (props.inputRef) props.inputRef.current?.focus();
      }}
    >
      <div className="titletext">
        <span className="title">{props.title}</span>
        <span className="subtitle">{props.subtitle}</span>
      </div>
      <div className="input">{props.children}</div>
    </div>
  );
}
