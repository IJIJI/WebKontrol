import { type JSX, type ReactNode } from "react";

import "./updateMessage.less";
import { classNames } from "../../common/helpers/classNames";
import { Icons } from "../icons/Icons";

export enum MessageTone {
  /** Something happened and is worth knowing; nothing is wrong. */
  INFO = "info",
  /** Something went wrong. Stays until an operator says they have seen it. */
  PROBLEM = "problem",
}

/**
 * A short message about the update system, shaped as a bubble so it reads as a notice
 * rather than as part of the page's own layout.
 *
 * Dismissal is deliberately not offered for everything: only a finished outcome can be
 * acknowledged, because it describes something that already happened. A live condition
 * (a check that is failing, an update still settling) has no dismiss, since hiding it
 * would not make it untrue and it clears itself when the condition does.
 */
export function UpdateMessage({
  tone,
  children,
  onDismiss,
}: {
  tone: MessageTone;
  children: ReactNode;
  /** Present only for messages that can honestly be acknowledged. */
  onDismiss?: () => void | Promise<void>;
}): JSX.Element {
  return (
    <div className={classNames("updateMessage", tone)}>
      <span className="icon">
        {tone === MessageTone.PROBLEM ? <Icons.alert size={16} /> : <Icons.checkCircle size={16} />}
      </span>
      <span className="text">{children}</span>
      {onDismiss && (
        // ✕ is the house's non-destructive dismiss: the record stays, it just stops asking.
        <button type="button" className="dismiss" onClick={() => void onDismiss()} aria-label="Dismiss">
          <Icons.close size={14} />
        </button>
      )}
    </div>
  );
}
