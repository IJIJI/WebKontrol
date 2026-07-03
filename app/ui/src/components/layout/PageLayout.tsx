import { type JSX, useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import DesktopHeader from "./header/DesktopHeader"
import Sidebar from "./sidebar/Sidebar"
import AmbientGlowBackground from "../background/AmbientGlowBackground"

import "./layout.less";
import MainContentContainer from "./content/MainContentContainer"
import ContentSection from "./content/ContentSection"
import { BrandLogo } from "../branding/BrandLogo"
import { usePageContext } from "../../context/PageContext"
import { Icons } from "../icons/Icons"

const MOBILE_BREAKPOINT = 770
const TABLET_BREAKPOINT = 1000

// TODO: Make deviceType part of the context?
export enum DeviceType {
  MOBILE = "Mobile",
  TABLET = "Tablet",
  DESKTOP = "Desktop"
}

const getDeviceType = (width: number): DeviceType => {
  if (width < MOBILE_BREAKPOINT) return DeviceType.MOBILE;
  if (width < TABLET_BREAKPOINT) return DeviceType.TABLET
  return DeviceType.DESKTOP;
}

export default function PageLayout(): JSX.Element {
  const location = useLocation()
  const { title, back } = usePageContext()

  const [deviceType,   setDeviceType]   = useState(() => getDeviceType(window.innerWidth) );
  const [isCollapsed, setIsCollapsed] = useState(false);

  // const { status } = useApi()

  // Track Viewport. // TODO: Move to seperate component, helper or even context?
  useEffect(() => {
    const queries = [
      window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`),
      window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`),
    ]
    const handler = () => {
      const next = getDeviceType(window.innerWidth)
      setDeviceType(next)
      if (next !== DeviceType.DESKTOP) setIsCollapsed(true)
    }
    queries.forEach(q => q.addEventListener('change', handler))
    return () => queries.forEach(q => q.removeEventListener('change', handler))
  }, []);

  // Autocollapse nav on mobile. (Page load or to mobile transition)
  useEffect(() => {
    if (deviceType !== DeviceType.DESKTOP) setIsCollapsed(true)
  }, [location.pathname, deviceType])

  // TODO: Combine desktop and mobile header or autoswitch
  return(
    <div className="page-base">
      <AmbientGlowBackground />
      <ContentSection variant="glass" className={["page-layout", "pad-none"].filter(Boolean).join(" ")} >
        <div className="page-header logo">
          <BrandLogo size={20} version="v1.0" collapsed={isCollapsed} /> 
        </div>
        <div className="page-header title">
          <h1>
            {title.primary &&
              <span className="primary">
                {title.primary}
              </span>
            }
            {title.secondary &&
              <span className="secondary">
                {title.secondary}
              </span>
            }
          </h1>
          {back && 
            <NavLink to={back.path} className="back">
              <Icons.arrowBackward size={22} />
              <span className="label">
                {back.label ? back.label : "Back"}
              </span>
            </NavLink>
            }
        </div>
        <Sidebar className="page-sidebar" collapsed={isCollapsed} setCollapsed={setIsCollapsed} deviceType={deviceType} />
        <MainContentContainer className="page-content">
          <Outlet />
        </MainContentContainer>
      </ContentSection>
    </div>
  )

}

//      <DesktopHeader className="page-header" version="v1.0" collapsed={isCollapsed} setCollapsed={setIsCollapsed}/>
