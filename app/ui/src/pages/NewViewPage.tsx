import { type JSX } from "react/jsx-runtime";
import { SaveBar } from "../components/bottomBar/SaveBar";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ButtonSelectSetting } from "../components/settings/implementations/ButtonSelectSetting";
import { useApi } from "../context/ApiStateContext";
import { aggregateDrafts, useDraft } from "../helpers/DraftSave";
import toast from "react-hot-toast";
import { DisplayNameSetting } from "../components/settings/implementations/DisplayNameSetting";
import { DisplayName, DisplayNameSchema } from "../../../src/types/CommonTypes";

export enum TestViewType {
  WEBSITE = "website",
  BLOCK = "block",
  UNSET = "unset"
}

export type TestViewStructure = {
  name: Partial<DisplayName>,
  type: TestViewType,
}

export default function NewViewPage(): JSX.Element {
  const handlers = useApi().callBacks;

  // const formRef = useRef<HTMLFormElement>(null);

  // const handleForm = async (event: any): Promise<void> => {
  //   event.preventDefault();

  //   const datadiv = document.getElementById('datad');
  //   if (datadiv) 
  //     datadiv.innerHTML = JSON.stringify(event, null, 2);
  //   console.log(JSON.stringify(event, null, 2));
  // }
  const runtime = useApi().state?.runtime;

  const data: TestViewStructure = {
    name: {},
    type: TestViewType.UNSET
  }

  const baseSettings = useDraft(data);

  const { anyChanged, revertAll } = aggregateDrafts({"BASE": baseSettings});

  const onSave = async (): Promise<void> => {
    await toast.promise(
      Promise.all([
        // handlers.ui.updateRuntime(baseSettings.patch, false),
        console.log("patch:",baseSettings.patch),
        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        )
      ]),
      {
        loading: "Saving…",
        success: "Saved",
        error: (e: unknown) => (e instanceof Error ? e.message : "Failed to save settings"),
      },
    );
    revertAll();
  }
// TODO: Better styling? A more general way?
// TODO: Change over to an edit page? Have a create page with only the base settings?
  return (
    <>
      <h1 style={{marginBottom: "20px" }}>New View</h1>
      {/* <form onSubmit={handleForm} ref={formRef}> */}
        {/* <div className="formRow">
          <input type="text" name="name" id="viewName" />
          <select name="type" id="viewType">
            <option value="" disabled selected>-</option>
            <option value="website">website</option>
          </select>
          <input type="url" name="website" id="viewUrl" />
          <Button onClick={() => formRef.current?.requestSubmit()} type={ButtonType.ACCENT}>Create</Button>
        </div> */}
        <SaveBar visible={anyChanged} onSave={onSave} onDiscard={revertAll} />
        <SettingGroup title="Base">
          <DisplayNameSetting
            title="Name"
            subtitle="Display name, long and short"
            value={baseSettings.values.name}
            savedVal={baseSettings.saved.name}
            setValue={(value) => baseSettings.setField("name", value)}
          />
          {/* <ToggleSetting
            title="Disable Background"
            subtitle="Disable the moving background"
            value={uiDraft.values.disableBackground}
            savedVal={uiDraft.saved.disableBackground}
            setValue={(value) => uiDraft.setField("disableBackground", value)}
            // disabled={true}
          /> */}
        <ButtonSelectSetting<TestViewType>
          title="Type"
          subtitle="Set the block type"
          value={baseSettings.values.type}
          savedVal={baseSettings.saved.type}
          setValue={(value) => baseSettings.setField("type", value)}
          options={[ // TODO: Add a way to disable options, TODO: Switch over to dropdown.
            { label: "Website", value: TestViewType.WEBSITE },
            { label: "Blocks", value: TestViewType.BLOCK },
            { label: "UNSET", value: TestViewType.UNSET },
          ]}
        />
        </SettingGroup>
      {/* </form> */}
      <div id="datad"></div>
    </>
  );
}
