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
import { InfoPill } from "../components/pill/InfoPill";
import { Variant, FillStyle } from "../helpers/variants";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
import { ConnectionState } from "../../../src/types/CommonTypes";
import { UiTheme } from "../../../src/ui/schema";
import { useApi } from "../context/ApiStateContext";
import { LoadingPage } from "../components/layout/loading/LoadingPage";
import { NumberSetting } from "../components/settings/implementations/NumberSetting";



export default function SettingsPage(): JSX.Element {

  const runtime = useApi().state?.runtime;
  const handlers = useApi().callBacks;

  // Hooks must run unconditionally, before any early return; useDraft tolerates
  // undefined while runtime is still loading.
  const uiDraft = useDraft(runtime?.ui);
  const systemDraft = useDraft(runtime?.system);
  const viewManagerDraft = useDraft(runtime?.view);

  const { anyChanged, revertAll } = aggregateDrafts({"UI": uiDraft, "SYSTEM": systemDraft, "VIEW": viewManagerDraft});

  const onSave = async (): Promise<void> => {
    await toast.promise(
      Promise.all([
        handlers.ui.updateRuntime(uiDraft.patch, false),
        handlers.system.updateRuntime(systemDraft.patch, false),
        handlers.view.updateRuntime(viewManagerDraft.patch, false),
      ]),
      {
        loading: "Saving…",
        success: "Saved",
        error: (e: unknown) => (e instanceof Error ? e.message : "Failed to save settings"),
      },
    );
    revertAll();
  }

  if (!runtime) return <LoadingPage />;

  return (
    <>
      {/* <BottomBar visible={true}>
        <Button type={Variant.DEFAULT} style={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.ACCENT} style={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.DANGER} style={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.INFO} style={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.SUCCESS} style={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.WARNING} style={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.DEFAULT} style={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.ACCENT} style={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.DANGER} style={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.INFO} style={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.SUCCESS} style={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button type={Variant.WARNING} style={FillStyle.SKELETON} onClick={() => {}}> 
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
      <SettingGroup title="Views">
        <NumberSetting
            title="Default View Load Timeout"
            subtitle="The load timeout a view uses when it does not have a timeout set"
            value={viewManagerDraft.values.default_load_timeout / 1000 }
            savedVal={viewManagerDraft.saved.default_load_timeout / 1000 }
            min={0.5} // TODO: Derive from zod?
            // TODO: Add a default placeholder / background value? 
            // TODO: Add a way to set default? Remove the value?
            // TODO: Add a postfix for seconds? Add a formatting in general?
            setValue={(value) => viewManagerDraft.setField("default_load_timeout", value * 1000)}
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
          type={Variant.DANGER}
          style={FillStyle.SKELETON}
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
          <InfoPill type={Variant.DEFAULT} style={FillStyle.FILLED}>
            <span>WebKontrol v3</span>
          </InfoPill>
        </BaseSetting>
      </SettingGroup>
    </>
  );
}