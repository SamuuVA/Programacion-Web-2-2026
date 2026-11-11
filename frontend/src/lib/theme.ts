export const THEME_STORAGE_KEY = "nexusmarket-theme";

export type Theme = "light" | "dark";

export const THEME_COLORS: Record<Theme, string> = {
  light: "#f4f7f3",
  dark: "#0d2018"
};

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Runs synchronously in <head> before the first paint so the saved theme is
 * applied without a flash. Falls back to the system preference on first visit.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s==="light"||s==="dark"?s:(d?"dark":"light");var r=document.documentElement;r.setAttribute("data-theme",t);var c=t==="dark"?"${THEME_COLORS.dark}":"${THEME_COLORS.light}";var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].setAttribute("content",c)}}catch(e){}})();`;
