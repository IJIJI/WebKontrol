import { JSX, useState } from "react";
import { ConnectionStatus } from "../../context/ApiStateContext";



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

export default function ServerConnectionToast({state}: {state: ConnectionStatus}) {

  const stateVars = STATE_MAP[state];
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <div className={`toast connection ${stateVars.class}` + (!visible && "hidden")} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 'var(--border-radius-md)',
          background: hard ? 'var(--color-text-danger)' : 'var(--color-text-warning)',
          color: '#fff', fontSize: 12, fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,.25)',
      }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1L12 11.5H1L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <line x1="6.5" y1="5" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="6.5" cy="9.8" r=".6" fill="currentColor"/>
        </svg> // TODO: Move to icon library
        {stateVars.label} // TODO: In some sort of span?
        {stateVars.icon}
    </div>
  );
}