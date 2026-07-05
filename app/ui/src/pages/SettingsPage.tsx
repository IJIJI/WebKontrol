import { type JSX } from "react";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { ToggleSetting } from "../components/settings/implementations/ToggleSetting";
import { TextSetting } from "../components/settings/implementations/TextSetting";
import { ButtonSetting } from "../components/settings/implementations/ButtonSetting";
import { BaseSetting } from "../components/settings/BaseSetting";
import { useDraft } from "../helpers/DraftSave";
import { SaveBar } from "../components/bottomBar/SaveBar";
import { Button, ButtonStyle, ButtonType } from "../components/button/Button";
import { PillStyle, PillType, InfoPill } from "../components/pill/InfoPill";
import { BottomBar } from "../components/bottomBar/BottomBar";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
import { ConnectionState } from "../../../src/types/CommonTypes";

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

  const {saved, values, setField, revertAll, anyChanged} = useDraft(defaultValues);


  return (
    <>
      {/* <BottomBar visible={true}>
        <Button type={ButtonType.DEFAULT} style={ButtonStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.ACCENT} style={ButtonStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.DANGER} style={ButtonStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.INFO} style={ButtonStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.SUCCESS} style={ButtonStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.WARNING} style={ButtonStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.DEFAULT} style={ButtonStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.ACCENT} style={ButtonStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.DANGER} style={ButtonStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.INFO} style={ButtonStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.SUCCESS} style={ButtonStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={ButtonType.WARNING} style={ButtonStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
      </BottomBar> */}
      <SaveBar visible={anyChanged()} onSave={async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        revertAll();
      }} onDiscard={revertAll} />
      <SettingGroup title="Appearance">
        <ButtonSelectSetting<placeHolderTheme>
          title="Theme"
          subtitle="Override your system color scheme"
          value={values.theme}
          savedVal={saved.theme}
          setValue={(value) => setField("theme", value)}
          options={[
            { label: "Auto", value: "auto" },
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ]}
        />
        <ToggleSetting
          title="Disable Background"
          subtitle="Disable the moving background"
          value={values.disableBackground}
          savedVal={saved.disableBackground}
          setValue={(value) => setField("disableBackground", value)}
          // disabled={true}
        />
      </SettingGroup>
      <SettingGroup title="System">
        <TextSetting
            title="System Name"
            subtitle="Set a name for this system to easily identify it"
            value={values.systemName}
            savedVal={saved.systemName}
            setValue={(value) => setField("systemName", value)}
        />
      </SettingGroup>
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
      <SettingGroup title="Reset">
        <ButtonSetting 
          title="Reset System"
          subtitle="Restore all configuration to factory defaults"
          label="Reset"
          onClick={() => { alert("I DON'T WANT TO DIE")}}
          type={ButtonType.DANGER}
          style={ButtonStyle.SKELETON}
        />
      </SettingGroup>
      <SettingGroup title="About">
        <BaseSetting
          title="Status"
          subtitle="SystemStatus"
        >
          <StatusPill status={ConnectionState.ONLINE}/>
        </BaseSetting>
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
          <InfoPill type={PillType.DEFAULT} style={PillStyle.FILLED}>
            <span>WebKontrol v3</span>
          </InfoPill>
        </BaseSetting>
      </SettingGroup>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100%",
        height: "100vh",
        minHeight: "100vh"
      }}>

      </div>
    </>
  );
}