import { JSX, useEffect, useId, useRef, useState } from "react";
import { ConnectionStatus } from "../../context/ApiStateContext";
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

export default function useConnectionToast({state}: {state: ConnectionStatus}): void {
  const id = useId();

  const prevStateRef = useRef(state);
  
  const stateVars = STATE_MAP[state];
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;



  }, [state]);

  const showToast = (): void => {
    toast.custom(
    <div className={`toast connection ${stateVars.class}` + (!visible && "hidden")}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1L12 11.5H1L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <line x1="6.5" y1="5" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="6.5" cy="9.8" r=".6" fill="currentColor"/>
        </svg> // TODO: Move to icon library
        {stateVars.label} // TODO: In some sort of span?
        {stateVars.icon}
    </div>,
    { id: id, duration: Infinity },
    )
  };

  const hideToast = (): void => {
    toast.dismiss(id);
  }
}