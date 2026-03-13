// FE-03: Theme service — API + localStorage persistence
export type ThemePreference = "light" | "dark";

const STORAGE_KEY = "uigen-theme-preference";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(STORAGE_KEY) as ThemePreference) ?? "light";
}

export function storeTheme(theme: ThemePreference): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const res = await fetch("/api/user/theme");
    if (!res.ok) return getStoredTheme();
    const data = await res.json();
    return (data.themePreference as ThemePreference) ?? "light";
  } catch {
    return getStoredTheme();
  }
}

export async function updateThemePreference(theme: ThemePreference): Promise<void> {
  storeTheme(theme);
  try {
    await fetch("/api/user/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: theme }),
    });
  } catch {
    // Silently fail — preference already saved in localStorage
  }
}
