import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle";

vi.mock("@/hooks/use-theme", () => ({
  useTheme: vi.fn(),
}));

// Mock Button to avoid Radix/Next.js deps in unit test
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, "aria-label": ariaLabel, title, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={className}
    >
      {children}
    </button>
  ),
}));

import { useTheme } from "@/hooks/use-theme";

const mockToggleTheme = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useTheme as any).mockReturnValue({
    theme: "light",
    toggleTheme: mockToggleTheme,
    isLoading: false,
  });
});

afterEach(() => {
  cleanup();
});

test("renders Moon icon aria-label in light mode", () => {
  render(<ThemeToggle />);
  const button = screen.getByRole("button");
  expect(button.getAttribute("aria-label")).toBe("Cambiar a modo oscuro");
  expect(button.getAttribute("title")).toBe("Modo oscuro");
});

test("renders Sun icon aria-label in dark mode", () => {
  (useTheme as any).mockReturnValue({
    theme: "dark",
    toggleTheme: mockToggleTheme,
    isLoading: false,
  });
  render(<ThemeToggle />);
  const button = screen.getByRole("button");
  expect(button.getAttribute("aria-label")).toBe("Cambiar a modo claro");
  expect(button.getAttribute("title")).toBe("Modo claro");
});

test("calls toggleTheme when button is clicked", async () => {
  const user = userEvent.setup();
  render(<ThemeToggle />);
  await user.click(screen.getByRole("button"));
  expect(mockToggleTheme).toHaveBeenCalledTimes(1);
});

test("button is disabled when isLoading is true", () => {
  (useTheme as any).mockReturnValue({
    theme: "light",
    toggleTheme: mockToggleTheme,
    isLoading: true,
  });
  render(<ThemeToggle />);
  expect(screen.getByRole("button")).toBeDisabled();
});

test("button is enabled when isLoading is false", () => {
  render(<ThemeToggle />);
  expect(screen.getByRole("button")).not.toBeDisabled();
});
