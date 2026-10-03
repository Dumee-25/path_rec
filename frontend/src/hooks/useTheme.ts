import { useCallback, useEffect, useState } from "react";
import { applyTheme, readTheme, resolveTheme, type ThemeChoice } from "../theme";

/** The saved theme choice, kept in step with the operating system while "System" is selected. */
export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolveTheme(choice));
    if (choice !== "system" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => document.documentElement.setAttribute("data-theme", resolveTheme("system"));
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [choice]);

  const update = useCallback((next: ThemeChoice) => {
    applyTheme(next);
    setChoice(next);
  }, []);

  return [choice, update];
}
