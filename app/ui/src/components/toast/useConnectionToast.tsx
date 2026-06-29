import { JSX, useEffect, useId, useRef, useState } from "react";
import { ConnectionStatus } from "../../context/types";
import { toast } from "react-hot-toast"

import './toast.less';

const STATE_MAP: Record<ConnectionStatus, {class: string, label: string, icon: JSX.Element | null}> = {
  [ConnectionStatus.CONNECTING]: {
    class: "connecting",
    label: "Connecting...",
    icon: null
  },
  [ConnectionStatus.CONNECTED]: {
    class: "connected",
    label: "Connected",
    icon: null
  },
  [ConnectionStatus.DISCONNECTED]: {
    class: "disconnected",
    label: "No Connection",
    icon: null
  },
}

export default function useConnectionToast({state, connected_timeout = 1_000}: {state: ConnectionStatus, connected_timeout?: number}): void {
  const id = useId();

  const prevStateRef = useRef(state); // TODO: Beter initial handeling?
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const stateVars = STATE_MAP[state];
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state; // TODO: Update on state change

    if (state != ConnectionStatus.CONNECTED) { // TODO: Only show if prev is different?
      showToast();
    }
    else if (!hideTimeoutRef || prev != state) {
      startHideTimout();
    }


  }, [state]);

  const showToast = (): void => {
    hideToast();
    toast.custom( // TODO: Move into toast template component? // TODO: Move to icon library
      <div className={`toast connection ${stateVars.class}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1L12 11.5H1L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <line x1="6.5" y1="5" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="6.5" cy="9.8" r=".6" fill="currentColor"/>
          </svg> 
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