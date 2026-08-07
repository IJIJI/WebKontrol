import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./fontSetting.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { EntityPicker } from "../../pickers/EntityPicker";
import { CollectionLayout } from "../../collections/types";
import { Icons } from "../../icons/Icons";
import { DEFAULT_ENTITY_COLOR } from "../../../common/appearance";

// Fonts the picker offers: web-safe families every display's browser ships, so what it shows is
// what really renders. Bundled self-hosted fonts join this list when they land (backlog).
export const FONT_SUGGESTIONS = [
  "system-ui", "Arial", "Helvetica", "Verdana", "Tahoma", "Trebuchet MS",
  "Times New Roman", "Georgia", "Courier New", "monospace", "serif", "sans-serif",
];

// A font family field: free text (any CSS family list stays expressible) plus a searchable
// picker whose rows each render in their font. The input deliberately does NOT preview its
// value: a typo'd/unknown family silently renders in the fallback font, so a preview would
// show "the previous font" and mislead.
export function FontSetting(props: InputSettingProps<string>): JSX.Element {
  const [picking, setPicking] = useState(false);

  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => (
        <>
          <button
            type="button"
            className="fontPickButton"
            onClick={() => setPicking(true)}
            disabled={props.disabled}
            aria-label={`Choose ${props.title.toLowerCase()}`}
            title="Choose a font"
          >
            <Icons.textFields size={14} />
          </button>
          <input
            className={"textfield" + (changed ? " changed" : "")}
            type="text"
            placeholder={props.placeholder}
            ref={inputRef}
            value={props.value}
            onChange={(event) => void props.setValue(event.target.value)}
            disabled={props.disabled}
          />
          <EntityPicker
            open={picking}
            onClose={() => setPicking(false)}
            title="Choose font"
            items={FONT_SUGGESTIONS}
            getKey={(font) => font}
            searchText={(font) => font}
            layout={CollectionLayout.LIST}
            fixedSize
            empty="No fonts match."
            onConfirm={(selected) => {
              if (selected[0]) void props.setValue(selected[0]);
            }}
            // icon: null = no icon box, keeping the rows as compact as a plain font list.
            renderCard={(font) => ({
              title: <span className="fontPreview" style={{ fontFamily: font }}>{font}</span>,
              icon: null,
              color: DEFAULT_ENTITY_COLOR,
            })}
          />
        </>
      )}
    </ValueSetting>
  );
}
