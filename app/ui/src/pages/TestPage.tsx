import { type JSX } from "react/jsx-runtime";
import { Icons } from "../components/icons/Icons";
import "./testPage.less";
import { ColorSetting } from "../components/settings/implementations/ColorSetting";
import { useState } from "react";
import { IconSetting } from "../components/settings/implementations/IconSetting";
import { SettingWidth } from "../components/settings/settingWidth";

export default function TestPage(): JSX.Element {

  const [color, setColor] = useState<string>();
  const [icon, setIcon] = useState<string>();

  return (
    <div className="testPage">
      <h2>Icons</h2>
      <div className="testPage-iconGrid">
        {(Object.entries(Icons) as [keyof typeof Icons, (typeof Icons)[keyof typeof Icons]][]).map(
          ([name, Icon]) => (
            <div key={name} className="testPage-iconCell">
              <Icon size={24} />
              <span>{name}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
