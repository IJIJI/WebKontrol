import { JSX, useEffect, useId, useRef, useState } from "react";
import { ConnectionStatus } from "../../context/types";
import { toast } from "react-hot-toast"

import './toast.less';
import { Icons } from "../icons/icons";

const STATE_MAP: Record<ConnectionStatus, {class: string, label: string, icon: JSX.Element | null}> = {
  [ConnectionStatus.CONNECTING]: {
    class: "connecting",
    label: "Connecting...",
    icon: <Icons.loading size={16}/>
  },
  [ConnectionStatus.CONNECTED]: {
    class: "connected",
    label: "Connected",
    icon: <Icons.check size={16}/>
  },
  [ConnectionStatus.DISCONNECTED]: {
    class: "disconnected",
    label: "No Connection",
    icon: <Icons.warning size={16}/>
  },
}; // TODO: Add icon size as param to funct

export default function useConnectionToast({state, connected_timeout = 750}: {state: ConnectionStatus, connected_timeout?: number}): void {
  const id = useId();

  const prevStateRef = useRef(state); // TODO: Beter initial handeling?
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const stateVars = STATE_MAP[state];
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state; // TODO: Update on state change

    if (state != ConnectionStatus.CONNECTED && prev != state) { // TODO: Only show if prev is different?
      showToast();
    }
    else if (visible && (!hideTimeoutRef || prev != state)) {
      showToast();
      startHideTimout();
    }


  }, [state]);

  const showToast = (): void => {
    hideToast();
    toast.custom( // TODO: Move into toast template component? // TODO: Move to icon library
      <div className={`toast connection ${stateVars.class}`}>
          {stateVars.label} 
          {stateVars.icon}
      </div>, // TODO: Above in some sort of span?
      { id: id, duration: Infinity },
    );
    setVisible(true);
  };

  const hideToast = (): void => {
    cancelHideTimeout();
    if(!visible) return;
    setVisible(false);
    toast.dismiss(id);
  }

  const startHideTimout = (): void => {
    hideTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, connected_timeout);
  }

  const cancelHideTimeout = (): void => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }
}