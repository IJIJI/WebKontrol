import { type JSX } from "react/jsx-runtime";
import toast from "react-hot-toast";

import "./copyButton.less";
import { Icons } from "../icons/Icons";

// A small icon button that copies `text` to the clipboard.
export function CopyButton({ text, label }: { text: string; label?: string }): JSX.Element {
  const copy = (): void => {
    void navigator.clipboard.writeText(text).then(
      () => toast("Copied"),
      () => toast.error("Copy failed"),
    );
  };

  return (
    <button type="button" className="copyButton" aria-label={label ?? "Copy"} onClick={copy}>
      <Icons.copy size={14} />
    </button>
  );
}
