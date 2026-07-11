import type { JSX } from "react/jsx-runtime";
import { DeviceType } from "../PageLayout";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";

import "./sidebar.less";
import { Icons } from "../../icons/Icons";
import SidebarCollapseButton from "./SidebarCollapseButton";
import { type UiPuppetState, useApi } from "../../../context/ApiStateContext";
import SidebarLoader from "./SidebarLoader";
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

export default function Sidebar({
  collapsed,
  setCollapsed,
  deviceType,
  heightGrow = true,
  className,
}: {
  collapsed: boolean;
  setCollapsed: (state: boolean) => void;
  deviceType: DeviceType;
  heightGrow?: boolean;
  className?: string;
}): JSX.Element {

  const puppets = useApi().state?.puppets;
  
  return (
    // <ContentSection variant="glass" className={["sidebar", deviceType == DeviceType.MOBILE && "mobile", "pad-none", heightGrow && "height-100", className].filter(Boolean).join(" ")} >
    <nav
      className={[
        "sidebar",
        deviceType == DeviceType.MOBILE && "mobile",
        heightGrow && "height-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SidebarItem
        collapsed={collapsed}
        to="/"
        label="Home"
        icon={<Icons.home />}
      />
      <SidebarSection collapsed={collapsed} label="Overview">
        <SidebarItem
          collapsed={collapsed}
          to="/dashboard"
          label="Dashboard"
          icon={<Icons.grid />}
        />
        <SidebarItem
          collapsed={collapsed}
          to="/views"
          label="Views"
          icon={<Icons.tab />}
        />
      </SidebarSection>
      <SidebarSection collapsed={collapsed} label="Puppets">
        {puppets?.size ?
          [...puppets].map(([key, value]: [string, UiPuppetState]) => (
            <SidebarItem
              key={key}
              collapsed={collapsed}
              to={`/puppets/${key}`}
              label={value.config.name.short}
              icon={<Icons.screen />}
            />
          ))
          : <SidebarLoader collapsed={collapsed} />
        }
      </SidebarSection>
      <SidebarSection collapsed={collapsed} label="Settings">
        <SidebarItem
          collapsed={collapsed}
          to="/settings/plugins"
          label="Plugins"
          icon={<Icons.connections />}
        />
        <SidebarItem
          collapsed={collapsed}
          to="/settings/config"
          label="Config"
          icon={<Icons.settings />}
        />
      </SidebarSection>

      <SidebarCollapseButton
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
    </nav>
    // </ContentSection>
  );
}
