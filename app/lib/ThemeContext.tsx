"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ThemeContextValue = {
  isDark: boolean;
  setDark: (v: boolean) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  setDark: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "freelanceit_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Read preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsDark(stored === "dark");
        return;
      }
      // Fall back to candidat or recruteur settings if theme key not set yet
      const candidatRaw = localStorage.getItem("freelanceit_candidate_settings");
      if (candidatRaw) {
        const parsed = JSON.parse(candidatRaw);
        if (parsed?.appearance?.darkMode === true) { setIsDark(true); return; }
      }
      const recruteurRaw = localStorage.getItem("freelanceit_recruteur_settings");
      if (recruteurRaw) {
        const parsed = JSON.parse(recruteurRaw);
        if (parsed?.appearance?.darkMode === true) { setIsDark(true); return; }
      }
    } catch { /* ignore */ }
  }, []);

  // Apply/remove class on <html> whenever isDark changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch { /* ignore */ }
  }, [isDark]);

  const setDark = useCallback((v: boolean) => setIsDark(v), []);
  const toggle = useCallback(() => setIsDark((p) => !p), []);

  return (
    <ThemeContext.Provider value={{ isDark, setDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
