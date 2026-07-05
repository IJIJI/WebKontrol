import { type JSX } from "react/jsx-runtime";

import "./bar.less";
import { BottomBar } from "./BottomBar";
import { Button, ButtonType } from "../button/Button";

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
        <Button label={"Discard"} type={ButtonType.DANGER} onClick={onDiscard} />
        <Button label={"Save"} type={ButtonType.SUCCESS} onClick={onSave}/>
      </div>
    </BottomBar>
  );
}
