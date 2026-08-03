import { type JSX } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { SaveBar } from "../components/bottomBar/SaveBar";
import { SettingGroup } from "../components/settings/SettingGroup";
import { DisplayNameSetting } from "../components/settings/implementations/DisplayNameSetting";
import { SelectSetting } from "../components/settings/implementations/SelectSetting";
import { ColorSetting } from "../components/settings/implementations/ColorSetting";
import { IconSetting } from "../components/settings/implementations/IconSetting";
import { SchemaSettings } from "../components/settings/SchemaSettings";
import {
  VIEW_EDITORS,
  viewTypeOptions,
  type ViewEditorValues,
} from "../components/views/viewEditors";
import { useDraft } from "../common/hooks/DraftSave";
import { useApi } from "../context/ApiStateContext";
import { type ViewType, type AnyViewConfig } from "../../../src/views/types/schema";
import { usePageContext } from "../context/PageContext";

const DEFAULT_TYPE: ViewType = "url";

// Editor for a single view, used for both create (/views/new, no key) and edit (/views/:viewKey).
// Same draft model either way; only the seed (empty vs saved) and the save action differ.
export default function EditViewPage(): JSX.Element {
  const { viewKey } = useParams();
  const { state, callBacks } = useApi();
  const navigate = useNavigate();
  const { setMeta } = usePageContext();
  const [title, setTitle] = useState<string>(viewKey ?? "New View");

  // Edit => the saved config; new => the default type's empty draft.
  const savedConfig = viewKey ? state?.views.get(viewKey)?.config : undefined;
  const initial = useMemo<ViewEditorValues>(
    () => ({ ...(savedConfig ?? VIEW_EDITORS[DEFAULT_TYPE].emptyDraft) }),
    [savedConfig],
  );

  useEffect(() => {
    setTitle(savedConfig?.name.long ?? viewKey ?? "New View");
  }, [savedConfig])

  useEffect(() => {
    // if (puppet) setMeta({ title: ["Puppet", puppet.displayName] }, true);
    setMeta({ title: ["overview", { label: "views", path: "/views" }, {label: title, path: `/views/${viewKey}` }, "edit"] }, true);
  }, [viewKey, setMeta, title]);

  const draft = useDraft<ViewEditorValues>(initial);

  const type = draft.values.type ?? DEFAULT_TYPE;
  const entry = VIEW_EDITORS[type] ?? VIEW_EDITORS[DEFAULT_TYPE];
  const Body = entry.body;
  // The ViewManager's configured default, shown as the loadTimeout placeholder when unset.
  const defaultLoadTimeout = state?.runtime.view.default_load_timeout;

  const onSave = async (): Promise<void> => {
    // Validate against the current type's real schema (strips stale fields from a type switch).
    const parsed = entry.schema.safeParse(draft.values);
    if (!parsed.success) {
      // List each failing field until inline per-field errors land (task #12).
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
        .join("\n");
      toast.error(details || "Invalid view configuration");
      return;
    }
    const config = parsed.data as AnyViewConfig;

    await toast.promise(
      (async (): Promise<void> => {
        if (viewKey) {
          await callBacks.view.update(viewKey, config);
        } else {
          const key = await callBacks.view.create(config);
          void navigate(`/views/${key}`);
        }
      })(),
      {
        loading: viewKey ? "Saving…" : "Creating…",
        success: viewKey ? "View saved" : "View created",
        error: (e: unknown) => (e instanceof Error ? e.message : "Failed to save view"),
      },
    );
    draft.revertAll();
  };

  return (
    <>
      <h1 style={{ marginBottom: "20px" }}>{`${viewKey ? "Edit " : ""}${title}`}</h1>

      <SaveBar visible={draft.anyChanged()} onSave={onSave} onDiscard={draft.revertAll} />

      <SettingGroup title="View">
        <DisplayNameSetting
          title="Name"
          subtitle="Display name, long and short"
          value={draft.values.name ?? {}}
          savedVal={draft.saved.name}
          setValue={(v) => draft.setField("name", v)}
        />
        <SelectSetting
          title="Type"
          subtitle="How this view renders"
          value={type}
          savedVal={draft.saved.type}
          setValue={(v) => draft.setField("type", v)}
          options={viewTypeOptions}
        />
      </SettingGroup>

      <SettingGroup title="Appearance">
        <ColorSetting
          title="Colour"
          subtitle="Badge and header tint"
          value={draft.values.appearance?.color}
          savedVal={draft.saved.appearance?.color}
          setValue={(color) => draft.setField("appearance", { ...draft.values.appearance, color })}
        />
        <IconSetting
          title="Icon"
          subtitle="Defaults to the view type icon"
          value={draft.values.appearance?.icon}
          savedVal={draft.saved.appearance?.icon}
          setValue={(icon) => draft.setField("appearance", { ...draft.values.appearance, icon })}
        />
      </SettingGroup>
        {Body ? (
          <Body draft={draft} />
        ) : (
          <SchemaSettings
            schema={entry.schema}
            draft={draft}
            exclude={["name"]}
            placeholders={defaultLoadTimeout != null ? { loadTimeout: String(defaultLoadTimeout) } : {}}
          />
        )}
    </>
  );
}
