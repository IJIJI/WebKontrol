import { type JSX, useEffect } from "react";
import { useParams } from "react-router-dom";

import { SaveBar } from "../components/bottomBar/SaveBar";
import { SettingGroup } from "../components/settings/SettingGroup";
import { ColorSetting } from "../components/settings/implementations/ColorSetting";
import { IconSetting } from "../components/settings/implementations/IconSetting";
import { useDraft } from "../common/hooks/DraftSave";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import type { EntityAppearance } from "../../../src/common/entityAppearance/schema";

export default function EditPuppetPage(): JSX.Element {
  const { puppetKey } = useParams();
  const { state, callBacks } = useApi();
  const { setMeta } = usePageContext();

  const puppet = puppetKey ? state?.puppets.get(puppetKey) : undefined;
  const title = puppet?.config.name.long ?? puppetKey ?? "Unknown Puppet";

  useEffect(() => {
    setMeta({ title: ["overview", { label: "Puppets", path: "/puppets" }, { label: title, path: `/puppets/${puppetKey}` }, "edit"] }, true);
  }, [puppetKey, setMeta, title]);

  const draft = useDraft<EntityAppearance>(puppet?.appearance ?? {});

  if (!puppet) return <h1>{title}</h1>;

  const onSave = async (): Promise<void> => {
    // The api layer already wraps the call in a toast; only revert on success.
    await callBacks.puppet.updateAppearance(puppet.config.id, draft.values); // TODO: Wrap in single combined toast promise once there are more fields
    draft.revertAll();
  };

  return (
    <>
      <h1 style={{ marginBottom: "20px" }}>Edit {title}</h1>

      <SaveBar visible={draft.anyChanged()} onSave={onSave} onDiscard={draft.revertAll} />

      <SettingGroup title="Appearance">
        <ColorSetting
          title="Colour"
          subtitle="Badge and header tint"
          value={draft.values.color}
          savedVal={draft.saved.color}
          setValue={(color) => draft.setField("color", color)}
        />
        <IconSetting
          title="Icon"
          subtitle="Defaults to the screen icon"
          value={draft.values.icon}
          savedVal={draft.saved.icon}
          setValue={(icon) => draft.setField("icon", icon)}
        />
      </SettingGroup>
    </>
  );
}
