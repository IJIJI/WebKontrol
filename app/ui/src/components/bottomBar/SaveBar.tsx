import { type JSX } from "react/jsx-runtime";

import "./bar.less";
import { BottomBar } from "./BottomBar";
import { Button } from "../button/Button";
import { Variant } from "../../common/types/variants";
import { Icons } from "../icons/Icons";
import { useEffect, useState } from "react";
import { useUnsavedPrompt } from "../../common/hooks/useUnsavedPrompt";

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

  // The bar is visible exactly while there are unsaved changes, so it doubles as the one place
  // every draft page gets the leave-warning from.
  useUnsavedPrompt(visible);

  const doSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  }

  // Ctrl+S saves the draft, and is claimed even when there is nothing to save: the browser's
  // save-page dialog is never what someone editing an admin form wants. Mounted here so every
  // draft page gets the shortcut the same way it gets the leave-warning. Cmd+S for macOS.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      // A held key repeats keydown; one save per press. isSaving guards a re-entrant save.
      if (event.repeat || !visible || isSaving) return;
      void doSave();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <BottomBar visible={visible} className="saveBar">
      <span className="saveTitle">Unsaved changes</span>
      <div className="saveButtons">
        <Button variant={Variant.DANGER} onClick={onDiscard} disabled={isSaving}>
          <Icons.undo size={20} />
          <p>Discard</p>
        </Button>
        <Button variant={Variant.SUCCESS} onClick={doSave} >
          { isSaving ? <Icons.loading size={19}/> : <Icons.check size={19} /> }
          <p>Save</p>
        </Button>
      </div>
    </BottomBar>
  );
}
