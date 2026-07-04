import { type JSX } from "react/jsx-runtime";

import "./settings.less";

export type BaseSettingsCompProps = {
  title: string;
  subtitle: string;
  inputRef: React.RefObject<any>;
  children: JSX.Element;
};

export type BaseSettingNonValProps = Omit<
  BaseSettingsCompProps,
  "inputRef" | "children"
> & {
  disabled?: boolean;
};

export type BaseSettingProps<T = any> = BaseSettingNonValProps & {
  value: T;
  setValue: (value: T) => void | Promise<void>;
};

// TODO: Add an easy way to add an InfoPill
export function BaseSetting(props: BaseSettingsCompProps): JSX.Element {
  return (
    <div
      className="setting field"
      onClick={() => {
        props.inputRef.current?.focus();
      }}
    >
      <div className="title">
        <span className="title">{props.title}</span>
        <span className="subtitle">{props.subtitle}</span>
      </div>
      <div className="input">{props.children}</div>
    </div>
  );
}
