import type { JSX } from "react/jsx-runtime";
import { DeviceType } from "../PageLayout";

export default function Sidebar({isCollapsed, setCollapsed, deviceType, className}: {isCollapsed: boolean, setCollapsed: (state: boolean) => void, deviceType: DeviceType, className?: string }): JSX.Element {
  return(
    <div className={["sidebar", deviceType == DeviceType.MOBILE && "mobile", className].filter(Boolean).join(" ")}>
    </div>
  );
}
