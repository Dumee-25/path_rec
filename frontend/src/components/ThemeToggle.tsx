import type { KeyboardEvent } from "react";
import type { ThemeChoice } from "../theme";

const THEMES: Array<{ value: ThemeChoice; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export interface ThemeToggleProps {
  value?: ThemeChoice;
  onChange?: (value: ThemeChoice) => void;
  /** Accessible group label. Default "Theme". */
  label?: string;
}

export function ThemeToggle({ value = "system", onChange, label = "Theme" }: ThemeToggleProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = Math.max(0, THEMES.findIndex((theme) => theme.value === value));
    const step = event.key === "ArrowRight" ? 1 : THEMES.length - 1;
    const next = THEMES[(current + step) % THEMES.length];
    if (!next) return;
    onChange?.(next.value);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div className="np-theme" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {THEMES.map((theme) => {
        const selected = theme.value === value;
        return (
          <button
            key={theme.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-value={theme.value}
            onClick={() => onChange?.(theme.value)}
          >
            {theme.label}
          </button>
        );
      })}
    </div>
  );
}
