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
      <ColorSetting title="Color" value={color} setValue={setColor} savedVal="#16b058"/>
      <ColorSetting title="Color" value={color} setValue={setColor} savedVal="#16b058" width={SettingWidth.COMPACT}/>
      <IconSetting title="Icon" subtitle="bladiebla" value={icon} setValue={setIcon} savedVal="cogs" />
      <IconSetting title="Icon" value={icon} setValue={setIcon} savedVal="cogs" width={SettingWidth.COMPACT}/>
    </div>
  );
}
