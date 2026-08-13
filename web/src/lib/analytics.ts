/** Anonymous visit / funnel analytics (Baidu Tongji + optional GA4). */

const BAIDU_ID = (import.meta.env.VITE_BAIDU_TONGJI_ID as string | undefined)?.trim();
const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();

declare global {
  interface Window {
    _hmt?: Array<unknown[]>;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

/** Call once at app boot. No-ops when no tracking IDs are configured. */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (BAIDU_ID) {
    window._hmt = window._hmt || [];
    loadScript(`https://hm.baidu.com/hm.js?${BAIDU_ID}`, "doti-baidu-tongji");
  }

  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, "doti-ga4");
  }
}

export function trackPageView(path: string) {
  if (BAIDU_ID && window._hmt) {
    window._hmt.push(["_trackPageview", path]);
  }
  if (GA_ID && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: document.title,
    });
  }
}

export function trackEvent(
  name: string,
  params: Record<string, string | number | undefined> = {},
) {
  const label = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  if (BAIDU_ID && window._hmt) {
    window._hmt.push(["_trackEvent", "doti", name, label || undefined]);
  }
  if (GA_ID && window.gtag) {
    window.gtag("event", name, params);
  }
}

export const AnalyticsEvents = {
  quizStart: "quiz_start",
  quizResume: "quiz_resume",
  quizComplete: "quiz_complete",
  savePoster: "save_poster",
} as const;

const JUST_COMPLETED_KEY = "doti.quiz.just_completed";

/** Mark this tab as having just submitted a quiz (not a shared result link). */
export function markQuizJustCompleted() {
  try {
    sessionStorage.setItem(JUST_COMPLETED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** True once per submit; shared / refreshed result links return false. */
export function consumeQuizJustCompleted(): boolean {
  try {
    const hit = sessionStorage.getItem(JUST_COMPLETED_KEY) === "1";
    if (hit) sessionStorage.removeItem(JUST_COMPLETED_KEY);
    return hit;
  } catch {
    return false;
  }
}
