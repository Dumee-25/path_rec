import { describe, expect, it, vi } from "vitest";
import { applyTheme, readTheme, resolveTheme } from "../theme";

function prefersDark(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches, media: query }));
}

describe("theme", () => {
  it("applies a choice to <html> and remembers it", () => {
    applyTheme("dark");

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(readTheme()).toBe("dark");
  });

  it("resolves System from the operating system preference", () => {
    prefersDark(true);
    expect(resolveTheme("system")).toBe("dark");

    prefersDark(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("stores System as the choice but sets the resolved theme", () => {
    prefersDark(true);

    applyTheme("system");

    expect(localStorage.getItem("theme")).toBe("system");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("falls back to System when nothing valid is saved", () => {
    expect(readTheme()).toBe("system");

    localStorage.setItem("theme", "purple");
    expect(readTheme()).toBe("system");
  });
});
