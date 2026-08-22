import { type JSX } from "react";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { ToggleSetting } from "../components/settings/implementations/ToggleSetting";
import { TextSetting } from "../components/settings/implementations/TextSetting";
import { ButtonSetting } from "../components/settings/implementations/ButtonSetting";
import { BaseSetting } from "../components/settings/BaseSetting";
import { aggregateDrafts, useDraft } from "../common/hooks/DraftSave";
import { SaveBar } from "../components/bottomBar/SaveBar";
import { InfoPill } from "../components/pill/InfoPill";
import { Variant, FillStyle } from "../common/types/variants";
import { StatusPill } from "../components/pill/statusPill/StatusPill";
import { ConnectionState } from "../../../src/types/CommonTypes";
import { UiTheme } from "../../../src/ui/schema";
import { useApi, withToast } from "../context/ApiStateContext";
import { LoadingPage } from "../components/layout/loading/LoadingPage";
import { NumberSetting } from "../components/settings/implementations/NumberSetting";
import { UpdateSettings } from "../components/updates/UpdateSettings";



export default function SettingsPage(): JSX.Element {

  const runtime = useApi().state?.runtime;
  const handlers = useApi().callBacks;

  // Hooks must run unconditionally, before any early return; useDraft tolerates
  // undefined while runtime is still loading.
  const uiDraft = useDraft(runtime?.ui);
  const systemDraft = useDraft(runtime?.system);
  const viewManagerDraft = useDraft(runtime?.view);

  const { anyChanged, revertAll, save } = aggregateDrafts([uiDraft, systemDraft, viewManagerDraft]);

  // The three updates are separate requests, so they opt out of their own toasts (notify: false)
  // and share one here instead.
  const onSave = (): Promise<void> =>
    save(() =>
      withToast(
        Promise.all([
          handlers.ui.updateRuntime(uiDraft.patch, false),
          handlers.system.updateRuntime(systemDraft.patch, false),
          handlers.view.updateRuntime(viewManagerDraft.patch, false),
        ]),
        { loading: "Saving…", success: "Saved" },
      ),
    );

  if (!runtime) return <LoadingPage />;

  return (
    <>
      {/* <BottomBar visible={true}>
        <Button variant={Variant.DEFAULT} fillStyle={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.ACCENT} fillStyle={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.DANGER} fillStyle={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.INFO} fillStyle={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.SUCCESS} fillStyle={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.WARNING} fillStyle={FillStyle.FILLED} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.DEFAULT} fillStyle={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.ACCENT} fillStyle={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.DANGER} fillStyle={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.INFO} fillStyle={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.SUCCESS} fillStyle={FillStyle.SKELETON} onClick={() => {}}> 
          save
        </Button>
        <Button variant={Variant.WARNING} fillStyle={FillStyle.SKELETON} onClick={() => {}}> 
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
            // Cleared field: store nothing and let the schema's default apply on save.
            setValue={(value) => viewManagerDraft.setField("default_load_timeout", value === undefined ? undefined : value * 1000)}
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
          variant={Variant.DANGER}
          fillStyle={FillStyle.SKELETON}
        />
      </SettingGroup>
      <SettingGroup title="About">
        <BaseSetting
          title="Status"
          subtitle="SystemStatus"
        >
          <StatusPill status={ConnectionState.ONLINE}/>
        </BaseSetting>
        <UpdateSettings />
        <BaseSetting
          title="Hardware"
          subtitle="Hardware Type"
        >
          <InfoPill variant={Variant.DEFAULT} fillStyle={FillStyle.FILLED}>
            <span>WebKontrol v3</span>
          </InfoPill>
        </BaseSetting>
      </SettingGroup>
    </>
  );
}