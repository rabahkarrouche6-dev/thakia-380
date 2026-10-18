import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const themeContext = readFileSync(resolve(process.cwd(), "client/src/contexts/ThemeContext.tsx"), "utf8");
const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("automatic workspace theme", () => {
  it("defaults the application to the operating-system preference", () => {
    expect(app).toContain('defaultTheme="system"');
    expect(themeContext).toContain('type ThemePreference = Theme | "system"');
    expect(themeContext).toContain('window.matchMedia("(prefers-color-scheme: dark)")');
  });

  it("keeps manual preference and system-change handling available", () => {
    expect(themeContext).toContain("setThemePreference");
    expect(themeContext).toContain("mediaQuery.addEventListener?.(\"change\", handleChange)");
    expect(themeContext).toContain('window.localStorage.setItem("theme", preference)');
    expect(themeContext).toContain("setThemePreference(theme === \"light\" ? \"dark\" : \"light\")");
  });

  it("updates the document color scheme for readable browser chrome", () => {
    expect(themeContext).toContain("root.style.colorScheme = theme");
    expect(themeContext).toContain('root.classList.toggle("dark", theme === "dark")');
  });
});
