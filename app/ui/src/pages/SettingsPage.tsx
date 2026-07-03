import { useState } from "react";
import ContentSection from "../components/layout/content/ContentSection";
import { SettingGroup } from "../components/settings/SettingGroup";
import { TextSetting } from "../components/settings/implementations/TextSetting";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { ToggleSetting } from "../components/settings/implementations/ToggleSetting";

type placeHolderTheme = "light" | "dark" | "auto";

export default function SettingsPage() {

  const [theme, setTheme] = useState<placeHolderTheme>("auto");
  const [disableBackground, setDisableBackground] = useState<boolean>(false);

  return (
    <>
      <SettingGroup title="Appearance" >
        <ButtonSelectSetting 
          title="Theme" 
          subtitle="Override your system color scheme" 
          value={theme} setValue={setTheme} 
          options={[
            {label: "Auto", value: "auto"},
            {label: "Light", value: "light"},
            {label: "Dark", value: "dark"},
          ]}
        />
        <ToggleSetting 
          title="Theme" 
          subtitle="Override your system color scheme" 
          value={disableBackground} setValue={setDisableBackground} 
        />
      </SettingGroup>
    </>
  );
}