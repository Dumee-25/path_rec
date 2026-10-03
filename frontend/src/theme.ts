export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

/** "light" or "dark" for a choice, reading prefers-color-scheme for "system". */
export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "light" || choice === "dark") return choice;
  const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return dark ? "dark" : "light";
}

/** Persists the choice to localStorage("theme") and sets data-theme on <html>. */
export function applyTheme(choice: ThemeChoice, root: HTMLElement = document.documentElement): ThemeChoice {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Storage can be unavailable (private windows); the choice just won't persist.
  }
  root.setAttribute("data-theme", resolveTheme(choice));
  return choice;
}

/** The saved choice, or "system". */
export function readTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch {
    return "system";
  }
}
