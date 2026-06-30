import { JSX, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useApi } from "../context/ApiStateContext"
import { toast } from "react-hot-toast"


const PAGE_TITLES: Record<string, string> = { // TODO: Dynamically set per page?
  '/overview':        'Home',
  '/views':           'Views',
  '/plugins':         'Plugins', // TODO: /settings/plugins?
  '/settings':        'Settings',
  '/settings/update': 'Update',
}

const MOBILE_BREAKPOINT = 768

export default function PageLayout(): JSX.Element {
  const location = useLocation()

  // TODO: (partially) In nav? Mobile open could in any case be generalised to expanded for both.
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  const [mobileOpen, setMobileOpen] = useState(false)

  // const { status } = useApi()

  // Track Viewport. // TODO: Move to seperate component, helper or even context?
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e: MediaQueryListEvent) => {
        setIsMobile(e.matches)
        if (!e.matches) setMobileOpen(false)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, []);

  // Autocollapse nav on mobile. (Page load or to mobile transition)
  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [location.pathname, isMobile])

  return(
    <div className="app-shell">
      
    </div>
  )

}