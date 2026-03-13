import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../theme-context";
import { useTheme } from "@/hooks/use-theme";

// Mock theme service — must come before any import of the module
vi.mock("@/lib/theme-service", () => ({
  getStoredTheme: vi.fn(() => "light"),
  getThemePreference: vi.fn(() => Promise.resolve("light")),
  updateThemePreference: vi.fn(() => Promise.resolve()),
  storeTheme: vi.fn(),
}));

import * as themeService from "@/lib/theme-service";

// Helper: component that surfaces context values for assertions
function ThemeConsumer() {
  const { theme, toggleTheme, isLoading } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

function Wrapped() {
  return (
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.classList.remove("dark");
  (themeService.getStoredTheme as any).mockReturnValue("light");
  (themeService.getThemePreference as any).mockResolvedValue("light");
  (themeService.updateThemePreference as any).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  test("defaults to light theme from localStorage stored value", async () => {
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("theme").textContent).toBe("light")
    );
  });

  test("applies stored dark theme on mount", async () => {
    (themeService.getStoredTheme as any).mockReturnValue("dark");
    (themeService.getThemePreference as any).mockResolvedValue("dark");
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    );
  });

  test("syncs server theme that differs from stored theme", async () => {
    (themeService.getStoredTheme as any).mockReturnValue("light");
    (themeService.getThemePreference as any).mockResolvedValue("dark");
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    );
  });

  test("isLoading is false after server sync completes", async () => {
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
  });

  test("toggleTheme switches from light to dark", async () => {
    const user = userEvent.setup();
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    await user.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  test("toggleTheme switches from dark to light", async () => {
    (themeService.getStoredTheme as any).mockReturnValue("dark");
    (themeService.getThemePreference as any).mockResolvedValue("dark");
    const user = userEvent.setup();
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    await user.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  test("toggleTheme adds .dark class to html element", async () => {
    const user = userEvent.setup();
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    await user.click(screen.getByTestId("toggle"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("toggleTheme removes .dark class when switching to light", async () => {
    (themeService.getStoredTheme as any).mockReturnValue("dark");
    (themeService.getThemePreference as any).mockResolvedValue("dark");
    const user = userEvent.setup();
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    await user.click(screen.getByTestId("toggle"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  test("toggleTheme calls updateThemePreference with new theme", async () => {
    const user = userEvent.setup();
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    await user.click(screen.getByTestId("toggle"));
    expect(themeService.updateThemePreference).toHaveBeenCalledWith("dark");
  });

  test("storage event from another tab updates theme", async () => {
    render(<Wrapped />);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    // Simulate localStorage change from another tab
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "uigen-theme-preference",
        newValue: "dark",
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
