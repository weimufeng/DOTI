import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

/** Reports SPA route changes as page views. */
export function AnalyticsListener() {
  const location = useLocation();

  useEffect(() => {
    // Full path including GitHub Pages base (e.g. /DOTI/quiz).
    trackPageView(`${window.location.pathname}${location.search}`);
  }, [location.pathname, location.search]);


  return null;
}
