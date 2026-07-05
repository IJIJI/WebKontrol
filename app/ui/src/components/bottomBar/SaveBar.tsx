import { type JSX } from "react/jsx-runtime";

import "./bar.less";
import { BottomBar } from "./BottomBar";
import { Button, ButtonType } from "../button/Button";
import { Icons } from "../icons/Icons";
import { useState } from "react";

export function SaveBar({
  visible,
  onSave,
  onDiscard
}: {
  visible: boolean,
  onSave: () => void | Promise<void>,
  onDiscard: () => void | Promise<void>,
}): JSX.Element {

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const doSave = async (): Promise<void> => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  }

  return (
    <BottomBar visible={visible} className="saveBar">
      <span>Unsaved changes</span>
      <div className="saveButtons">
        <Button type={ButtonType.DANGER} onClick={onDiscard} disabled={isSaving}> 
          <Icons.undo size={20} />
          <p>Discard</p>
        </Button>
        <Button type={ButtonType.SUCCESS} onClick={doSave} > 
          { isSaving ? <Icons.loading size={19}/> : <Icons.check size={19} /> }
          <p>Save</p>
        </Button>
      </div>
    </BottomBar>
  );
}
