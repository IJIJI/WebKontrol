import { type JSX } from "react/jsx-runtime";

import { BlockViewConfigSchema } from "../../../../src/views/types/schema";
import { SchemaSettings } from "../settings/SchemaSettings";
import { SettingGroup } from "../settings/SettingGroup";
import { BlockEditor } from "../blockTree/editor/BlockEditor";
import { type BlockLike } from "../blockTree/model/blockUtils";
import { type ViewBodyProps } from "./viewEditors";

// The blocks view's editor body. The ordinary fields still go through the generic schema mapper
// (so they never drift from it); only `root` is taken over, by the full-width tree editor.
export function BlockViewBody({ draft, placeholders }: ViewBodyProps): JSX.Element {
  return (
    <>
      <SchemaSettings schema={BlockViewConfigSchema} draft={draft} exclude={["name", "root"]} placeholders={placeholders} />
      <SettingGroup title="Blocks">
        <BlockEditor
          root={draft.values.root as BlockLike | undefined}
          saved={draft.saved.root as BlockLike | undefined}
          onChange={(root) => draft.setField("root", root)}
        />
      </SettingGroup>
    </>
  );
}
