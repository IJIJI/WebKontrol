import { type JSX, useState } from "react";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { ToggleSetting } from "../components/settings/implementations/ToggleSetting";
import { TextSetting } from "../components/settings/implementations/TextSetting";
import { ButtonSetting, ButtonSettingType } from "../components/settings/implementations/ButtonSetting";
import { BaseSetting } from "../components/settings/BaseSetting";

type placeHolderTheme = "light" | "dark" | "auto";

export default function SettingsPage(): JSX.Element {
  const [theme, setTheme] = useState<placeHolderTheme>("auto");
  const [disableBackground, setDisableBackground] = useState<boolean>(false);
  const [systemName, setSystemName] = useState<string>("WebKontrol");

  return (
    <>
      <p style={{marginBottom: 50}}>
        theme: {theme}
        <br />
        disableBg: {disableBackground}
        <br />
        systemName: {systemName}
      </p>
      <SettingGroup title="Appearance">
        <ButtonSelectSetting<placeHolderTheme>
          title="Theme"
          subtitle="Override your system color scheme"
          value={theme}
          setValue={setTheme}
          options={[
            { label: "Auto", value: "auto" },
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ]}
        />
        <ToggleSetting
          title="Disable Background"
          subtitle="Disable the moving background"
          value={disableBackground}
          setValue={setDisableBackground}
        />
      </SettingGroup>
      <TextSetting 
          title="System Name"
          subtitle="Set a name for this system to easily identify it"
          value={systemName}
          setValue={setSystemName}
      />
      <SettingGroup title="Configuration">
        <ButtonSetting 
          title="Export Config"
          subtitle="Download the config file"
          label="Export"
          onClick={() => { alert("Huh why export?? I don't know her")}}
        />
        <ButtonSetting 
          title="Import Config"
          subtitle="Restore from a config file"
          label="Import"
          onClick={() => { alert("Huh why import?? He's scary...")}}
        />
      </SettingGroup>
      <SettingGroup title="About">
        <ButtonSetting 
          title="Firmware"
          subtitle="v1.0.0"
          label="Update"
          onClick={() => { alert("Yeah you wish, this don't exist yet.")}}
        />
        <BaseSetting
          title="Hardware"
          subtitle="Hardware Type"
        >
          <span>WebKontrol v3</span>
        </BaseSetting>
      </SettingGroup>
      <SettingGroup title="Reset">
        <ButtonSetting 
          title="Reset System"
          subtitle="Restore all configuration to factory defaults"
          label="Reset"
          onClick={() => { alert("I DON'T WANT TO DIE")}}
          type={ButtonSettingType.DANGER}
        />
      </SettingGroup>
    </>
  );
}
