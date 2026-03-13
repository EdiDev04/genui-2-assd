"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  type ThemePreference,
  getStoredTheme,
  getThemePreference,
  updateThemePreference,
} from "@/lib/theme-service";

interface ThemeContextType {
  theme: ThemePreference;
  toggleTheme: () => void;
  isLoading: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

function applyThemeToDom(theme: ThemePreference) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>("light");
  const [isLoading, setIsLoading] = useState(true);

  // Load preference on mount
  useEffect(() => {
    // Apply stored theme immediately to avoid flash
    const stored = getStoredTheme();
    setTheme(stored);
    applyThemeToDom(stored);

    // Then try to sync from server
    getThemePreference()
      .then((serverTheme) => {
        setTheme(serverTheme);
        applyThemeToDom(serverTheme);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Sync .dark class whenever theme changes
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  // Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "uigen-theme-preference" && e.newValue) {
        const newTheme = e.newValue as ThemePreference;
        setTheme(newTheme);
        applyThemeToDom(newTheme);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const next: ThemePreference = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyThemeToDom(next);
    // Async — does not block UI
    updateThemePreference(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
