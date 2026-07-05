import { type JSX } from "react/jsx-runtime";

import "./bar.less";
import { BottomBar } from "./BottomBar";
import { Button, ButtonType } from "../button/Button";
import { Icons } from "../icons/Icons";

export function SaveBar({
  visible,
  onSave,
  onDiscard
}: {
  visible: boolean,
  onSave: () => void | Promise<void>,
  onDiscard: () => void | Promise<void>,
}): JSX.Element {
  return (
    <BottomBar visible={visible} className="saveBar">
      <span>Unsaved changes</span>
      <div className="saveButtons">
        <Button type={ButtonType.DANGER} onClick={onDiscard} > 
          <Icons.undo size={20} />
          <p>Discard</p>
        </Button>
        <Button type={ButtonType.SUCCESS} onClick={onSave} > 
          <Icons.check size={19} />
          <p>Save</p>
        </Button>
      </div>
    </BottomBar>
  );
}
