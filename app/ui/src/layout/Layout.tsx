import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useApi } from "../context/ApiStateContext"
import { toast } from "react-hot-toast"


const CONNECTION_TOAST_ID = 'toast-connection'

// TODO: Needed?
const PAGE_TITLES: Record<string, string> = { // TODO: Dynamically set per page?
  '/devices':         'Devices',
  '/sources':         'Sources',
  '/connections':     'Connections',
  '/settings':        'Settings',
  '/settings/update': 'Update',
}

const MOBILE_BREAKPOINT = 768

export default function Layout() {
  const location = useLocation()

  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { status } = useApi()

  useEffect(() => {

  }, [status]);

}