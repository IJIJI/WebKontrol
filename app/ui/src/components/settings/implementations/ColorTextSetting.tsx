import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./colorSetting.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { Modal } from "../../modal/Modal";
import { ColorPalette } from "./ColorPalette";

// A CSS colour *expression*: `#abc`, `red`, `rgb(0 0 0 / 50%)` or a whole `linear-gradient(…)`.
// The text field is what keeps those expressible — the swatch beside it is an assist that opens
// the shared palette. Contrast with ColorSetting, whose value is a plain colour and so needs no
// text field at all.
export function ColorTextSetting(props: InputSettingProps<string>): JSX.Element {
  const [picking, setPicking] = useState(false);

  const set = (c: string): void => void props.setValue(c);

  return (
    <ValueSetting {...props}>
      {({ changed, inputRef }) => (
        <>
          <button
            type="button"
            className="swatchButton"
            // Any CSS background value previews here, gradients included.
            style={{ background: props.value || undefined }}
            onClick={() => setPicking(true)}
            disabled={props.disabled}
            aria-label={`Choose ${props.title.toLowerCase()}`}
            title="Choose a colour"
          />
          <input
            className={"textfield" + (changed ? " changed" : "")}
            type="text"
            placeholder={props.placeholder}
            ref={inputRef}
            value={props.value}
            onChange={(event) => set(event.target.value)}
            disabled={props.disabled}
          />
          <Modal open={picking} onClose={() => setPicking(false)} title="Choose colour">
            {/* Alpha is safe here: the value is a free CSS colour, so `#rrggbbaa` is valid.
                It also makes this a two-step control, so picking a swatch sets without closing:
                dismissing the modal mid-edit would strand you before setting transparency. */}
            <ColorPalette value={props.value || undefined} onSelect={set} onSet={set} alpha />
          </Modal>
        </>
      )}
    </ValueSetting>
  );
}
