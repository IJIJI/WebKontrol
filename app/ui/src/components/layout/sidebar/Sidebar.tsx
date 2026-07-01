import type { JSX } from "react/jsx-runtime";
import { DeviceType } from "../PageLayout";
import ContentSection from "../content/ContentSection";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";

import "./sidebar.less";
/* 
Home
views
Puppets >
- per puppet
settings >
- plugins
- config
*/
// TODO: Make configurable?

export default function Sidebar({collapsed, setCollapsed, deviceType, heightGrow = true, className}: {collapsed: boolean, setCollapsed: (state: boolean) => void, deviceType: DeviceType, heightGrow?: boolean, className?: string }): JSX.Element {
  return(
    <ContentSection variant="glass" className={["sidebar", deviceType == DeviceType.MOBILE && "mobile", "pad-none", heightGrow && "height-100", className].filter(Boolean).join(" ")} >
      <nav className="sidebar">
        <SidebarSection collapsed={collapsed} label="Overview"> 
          <SidebarItem collapsed={collapsed} to="/" label="Dashboard" icon={<></>} /> 
          <SidebarItem collapsed={collapsed} to="/views" label="Views" icon={<></>} /> 
        </SidebarSection>
        <SidebarSection collapsed={collapsed} label="Puppets"> 
          <SidebarItem collapsed={collapsed} to="/puppets/1" label="2: SDI1" icon={<></>} /> 
          <SidebarItem collapsed={collapsed} to="/puppets/2" label="1: SDI2" icon={<></>} /> 
        </SidebarSection>
        <SidebarSection collapsed={collapsed} label="Settings">
          <SidebarItem collapsed={collapsed} to="/settings/plugins" label="Plugins" icon={<></>} /> 
          <SidebarItem collapsed={collapsed} to="/settings" label="Config" icon={<></>} /> 
        </SidebarSection>
      </nav>
    </ContentSection>
    
  );
}
