import { useState } from "react";
import { type JSX } from "react/jsx-runtime";

import { useApi, type UiViewState } from "../../context/ApiStateContext";
import { ShareModal } from "../modal/ShareModal";
import { Button } from "../button/Button";
import { FillStyle } from "../../common/types/variants";
import { Icons } from "../icons/Icons";
import { AssignToViewModal } from "./AssignToViewModal";

// Share flow for a view: the generic ShareModal (QR + copyable link) plus the two view-specific
// actions, open the served page, or assign the view to a puppet (the AssignToViewModal stacks on top).
// Controlled + nullable `view` so the same instance serves the header and a collection row.
export function ShareViewModal({
  open,
  onClose,
  view,
}: {
  open: boolean;
  onClose: () => void;
  view?: UiViewState;
}): JSX.Element | null {
  const { state } = useApi();
  const [assignOpen, setAssignOpen] = useState(false);

  if (!view) return null;

  const url = view.url;
  const puppets = state ? [...state.puppets.values()] : [];

  return (
    <>
      <ShareModal
        open={open}
        onClose={onClose}
        url={url}
        title={
          <span>
            Share{" "}
            <b>
              <code>{view.config.name.long}</code>
            </b>
          </span>
        }
        actions={
          <>
            <Button fillStyle={FillStyle.FILLED} onClick={() => setAssignOpen(true)}>
              <Icons.installDesktop />
              <span>Assign</span>
            </Button>
            <Button
              fillStyle={FillStyle.FILLED}
              onClick={() => void window.open(url, "_blank", "noopener")}
            >
              <Icons.openInNew />
              <span>Open</span>
            </Button>
          </>
        }
      />
      <AssignToViewModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        view={view}
        puppets={puppets}
      />
    </>
  );
}
