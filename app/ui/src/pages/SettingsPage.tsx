import { type JSX } from "react";
import toast from "react-hot-toast";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { ToggleSetting } from "../components/settings/implementations/ToggleSetting";
import { TextSetting } from "../components/settings/implementations/TextSetting";
import { ButtonSetting } from "../components/settings/implementations/ButtonSetting";
import { BaseSetting } from "../components/settings/BaseSetting";
import { aggregateDrafts, useDraft } from "../helpers/DraftSave";
import { SaveBar } from "../components/bottomBar/SaveBar";
import { Button, ButtonStyle, ButtonType } from "../components/button/Button";
import { PillStyle, PillType, InfoPill } from "../components/pill/InfoPill";
import { BottomBar } from "../components/bottomBar/BottomBar";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
import { ConnectionState } from "../../../src/types/CommonTypes";
import { UiTheme } from "../../../src/ui/schema";
import { useApi } from "../context/ApiStateContext";
import { Icons } from "../components/icons/Icons";
import { LoadingPage } from "../components/layout/loading/LoadingPage";



export default function SettingsPage(): JSX.Element {

  const runtime = useApi().state?.runtime;
  const handlers = useApi().callBacks;

  if (!runtime) return <LoadingPage />;

  // const {saved, values, setField, revertAll, anyChanged} = useDraft(config?.ui);
  // const uiDraft = useDraft(config?.ui);
  const uiDraft = useDraft(runtime.ui);
  const systemDraft = useDraft(runtime.system);

  const { anyChanged, revertAll } = aggregateDrafts({"UI": uiDraft, "SYSTEM": systemDraft});

  const onSave = async (): Promise<void> => {
    await toast.promise(
      Promise.all([
        handlers.ui.updateRuntime(uiDraft.patch, false),
        handlers.system.updateRuntime(systemDraft.patch, false),
      ]),
      {
        loading: "Saving…",
        success: "Saved",
        error: (e: unknown) => (e instanceof Error ? e.message : "Failed to save settings"),
      },
    );
    revertAll();
  }


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
      <SaveBar visible={anyChanged} onSave={onSave} onDiscard={revertAll} />
      <SettingGroup title="Appearance">
        <ButtonSelectSetting<UiTheme>
          title="Theme"
          subtitle="Override your system color scheme"
          value={uiDraft.values.theme}
          savedVal={uiDraft.saved.theme}
          setValue={(value) => uiDraft.setField("theme", value)}
          options={[
            { label: "Auto", value: UiTheme.AUTO },
            { label: "Light", value: UiTheme.LIGHT },
            { label: "Dark", value: UiTheme.DARK },
          ]}
        />
        <ToggleSetting
          title="Disable Background"
          subtitle="Disable the moving background"
          value={uiDraft.values.disableBackground}
          savedVal={uiDraft.saved.disableBackground}
          setValue={(value) => uiDraft.setField("disableBackground", value)}
          // disabled={true}
        />
      </SettingGroup>
      <SettingGroup title="System">
        <TextSetting
            title="System Name"
            subtitle="Set a name for this system to easily identify it"
            value={systemDraft.values.system_name}
            savedVal={systemDraft.saved.system_name}
            setValue={(value) => systemDraft.setField("system_name", value)}
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