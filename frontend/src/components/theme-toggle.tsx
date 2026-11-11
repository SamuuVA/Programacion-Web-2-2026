"use client";

import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import {
  isTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type Theme
} from "@/lib/theme";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function readCurrentTheme(): Theme {
  const attribute = document.documentElement.getAttribute("data-theme");
  if (isTheme(attribute)) return attribute;

  const stored = readStoredTheme();
  if (stored) return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);

  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.content = THEME_COLORS[theme];
    });

  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (event: MediaQueryListEvent) => {
    // An explicit choice always wins over the system preference.
    if (readStoredTheme()) return;

    applyTheme(event.matches ? "dark" : "light");
  };

  media.addEventListener("change", handleChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", handleChange);
  };
}

// The inline script in <head> sets data-theme before paint, so reading the DOM
// keeps the toggle in sync with the palette that is actually rendered.
function getSnapshot(): Theme {
  return readCurrentTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Re-applies the saved theme after React's dev Strict Mode remount, which
  // resets the attributes on <html>. This is a no-op in production.
  useLayoutEffect(() => {
    applyTheme(readCurrentTheme());
  }, []);

  const selectTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }

    applyTheme(next);
  }, []);

  return (
    <div className="theme-toggle" role="group" aria-label="Tema de la interfaz">
      <button
        type="button"
        className="theme-toggle-option"
        data-theme-option="light"
        aria-pressed={theme === "light"}
        aria-label="Usar tema claro"
        title="Tema claro"
        onClick={() => selectTheme("light")}
      >
        <SunIcon width={18} height={18} />
      </button>
      <button
        type="button"
        className="theme-toggle-option"
        data-theme-option="dark"
        aria-pressed={theme === "dark"}
        aria-label="Usar tema oscuro"
        title="Tema oscuro"
        onClick={() => selectTheme("dark")}
      >
        <MoonIcon width={18} height={18} />
      </button>
    </div>
  );
}
