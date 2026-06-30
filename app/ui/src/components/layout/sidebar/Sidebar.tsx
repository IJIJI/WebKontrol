import type { JSX } from "react/jsx-runtime";
import { DeviceType } from "../PageLayout";
import ContentSection from "../content/ContentSection";

export default function Sidebar({isCollapsed, setCollapsed, deviceType, className}: {isCollapsed: boolean, setCollapsed: (state: boolean) => void, deviceType: DeviceType, className?: string }): JSX.Element {
  return(
    <ContentSection variant="glass" className={["sidebar", deviceType == DeviceType.MOBILE && "mobile", "pad-none", className].filter(Boolean).join(" ")} >
      <h1>test</h1>
    </ContentSection>
    
  );
}
