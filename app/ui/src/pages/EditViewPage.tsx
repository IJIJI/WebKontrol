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
import { Button } from "../components/button/Button";
import { Icons } from "../components/icons/Icons";
import { FillStyle } from "../common/types/variants";
import { AssignToViewModal } from "../components/views/AssignToViewModal";

const DEFAULT_TYPE: ViewType = "url";

// Editor for a single view, used for both create (/views/new, no key) and edit (/views/:viewKey).
// Same draft model either way; only the seed (empty vs saved) and the save action differ.
export default function EditViewPage(): JSX.Element {
  const { viewKey } = useParams();
  const { state, callBacks } = useApi();
  const navigate = useNavigate();
  // Set by a successful create, consumed by the effect below.
  const [createdKey, setCreatedKey] = useState<string | undefined>(undefined);
  const { setMeta } = usePageContext();
  const [title, setTitle] = useState<string>(viewKey ?? "New View");

  const [assignOpen, setAssignOpen] = useState(false);

  // Edit => the saved config; new => the default type's empty draft.
  const view = viewKey ? state?.views.get(viewKey) : undefined;
  const savedConfig = view?.config;
  const puppets = state ? [...state.puppets.values()] : [];
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
  const placeholders: Record<string, string> =
    defaultLoadTimeout != null ? { loadTimeout: String(defaultLoadTimeout) } : {};


  // Creating differs from editing only in not having a key yet, so once it has one the page
  // becomes the editor for it: same screen, no interruption. Deferred to an effect rather than
  // done inline after save(): the unsaved-changes guard reads the draft as last rendered, and
  // navigating in the same tick as the save still sees it dirty. Waiting for the clean render
  // is what silences the warning.
  // TODO: Check for cleaner solution
  useEffect(() => {
    if (createdKey === undefined || draft.anyChanged) return;
    void navigate(`/views/${createdKey}/edit`, { replace: true });
  }, [createdKey, draft.anyChanged, navigate]);

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
    // Checks the member schema can't express (e.g. per-block configs behind a loose `root`).
    const extra = entry.validate?.(draft.values) ?? [];
    if (extra.length > 0) {
      toast.error(extra.join("\n"));
      return;
    }

    const config = parsed.data as AnyViewConfig;

    await draft.save(async () => {
      if (viewKey) {
        await callBacks.view.update(viewKey, config);
      } else {
        setCreatedKey(await callBacks.view.create(config));
      }
    });
  };

  return (
    <>
      <div style={{ marginBottom: "20px", width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}> {/* Add styling in stylesheet? Some generic header? */}
        <h1 >{`${viewKey ? "Edit " : ""}${title}`}</h1>
        {/* Only once the view exists: a view being created has nothing to put on a display yet,
            and the modal would open onto nothing. It appears by itself after the first save. */}
        {view && (
          <Button onClick={() => setAssignOpen(true)} fillStyle={FillStyle.FILLED}>
            <Icons.installDesktop />
            <span>Assign</span>
          </Button>
        )}
      </div>

      <SaveBar visible={draft.anyChanged} onSave={onSave} onDiscard={draft.revertAll} />

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
          <Body draft={draft} placeholders={placeholders} />
        ) : (
          <SchemaSettings schema={entry.schema} draft={draft} exclude={["name"]} placeholders={placeholders} />
        )}

      {/* Assigns the SAVED view: a display shows what the server has, not the draft on screen.
          The SaveBar is right there when the two differ. */}
      <AssignToViewModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        view={view}
        puppets={puppets}
      />
    </>
  );
}
