import { type JSX, useState } from "react";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { ToggleSetting } from "../components/settings/implementations/ToggleSetting";
import { TextSetting } from "../components/settings/implementations/TextSetting";
import { ButtonSetting, ButtonSettingType } from "../components/settings/implementations/ButtonSetting";
import { BaseSetting } from "../components/settings/BaseSetting";

type placeHolderTheme = "light" | "dark" | "auto";

type SettingsValues = {
  theme: placeHolderTheme;
  disableBackground: boolean;
  systemName: string;
};

const defaultValues: SettingsValues = {
  theme: "auto",
  disableBackground: false,
  systemName: "WebKontrol",
};

export default function SettingsPage(): JSX.Element {
  const [savedValues, setSavedValues] = useState<SettingsValues>(defaultValues);
  const [draftValues, setDraftValues] = useState<SettingsValues>(defaultValues);

  function updateDraft<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]): void {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <p style={{marginBottom: 50}}>
        theme: {draftValues.theme}
        <br />
        disableBg: {draftValues.disableBackground}
        <br />
        systemName: {draftValues.systemName}
      </p>
      <SettingGroup title="Appearance">
        <ButtonSelectSetting<placeHolderTheme>
          title="Theme"
          subtitle="Override your system color scheme"
          value={draftValues.theme}
          savedVal={savedValues.theme}
          setValue={(value) => updateDraft("theme", value)}
          options={[
            { label: "Auto", value: "auto" },
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ]}
        />
        <ToggleSetting
          title="Disable Background"
          subtitle="Disable the moving background"
          value={draftValues.disableBackground}
          savedVal={savedValues.disableBackground}
          setValue={(value) => updateDraft("disableBackground", value)}
          // disabled={true}
        />
      </SettingGroup>
      <TextSetting
          title="System Name"
          subtitle="Set a name for this system to easily identify it"
          value={draftValues.systemName}
          savedVal={savedValues.systemName}
          setValue={(value) => updateDraft("systemName", value)}
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
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vestibulum pellentesque sem quis mattis. Nullam pretium dui vel eros sodales facilisis. Cras viverra vitae lorem non fermentum. Proin ut varius lorem. Maecenas eget lacinia neque. Etiam pretium sodales enim, at lacinia eros sollicitudin vel. Phasellus pulvinar sagittis facilisis. Morbi lacinia scelerisque velit ac luctus. Nunc vitae nulla libero. Donec et congue sapien, dignissim dignissim lorem. Quisque mollis dolor eu turpis lobortis fringilla. Maecenas id pharetra libero, ac eleifend tellus. Etiam at tellus turpis. Sed quis arcu aliquam, condimentum nisl quis, fringilla ligula.

Suspendisse nisl risus, commodo eu posuere ac, maximus vel risus. Aliquam mollis odio vehicula, dictum nisl vel, venenatis neque. Vivamus efficitur ultrices mi, ut sollicitudin dolor aliquet at. Fusce vitae rhoncus diam. Suspendisse eu dui nec nulla dictum sagittis in in sem. Etiam vitae viverra risus, at varius nibh. Phasellus maximus commodo porta. Nam non augue consectetur tortor sagittis hendrerit. Aenean fringilla libero vitae turpis condimentum egestas. Fusce ullamcorper dictum enim non finibus. Vestibulum pharetra eu felis sit amet eleifend. Nunc ipsum lectus, venenatis feugiat arcu quis, accumsan porttitor nunc. Praesent finibus urna nec libero commodo ultrices in sit amet mauris. Cras in enim eu diam volutpat feugiat. Aliquam blandit sagittis enim at laoreet.

Donec sagittis sollicitudin augue vitae sollicitudin. Sed at consequat est, in lacinia ex. Etiam augue orci, finibus sed mattis et, tincidunt et arcu. Quisque congue sodales mi, non venenatis elit ullamcorper non. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi ullamcorper lectus ut auctor varius. Etiam quis finibus sem. Praesent ipsum tellus, interdum ac libero nec, dignissim aliquam odio. Aenean non dui nec felis vulputate commodo egestas id metus. Sed a vulputate odio, at venenatis neque.
      </p>
    </>
  );
}
