import type { MouseEvent, ReactNode } from "react";
import { cx } from "../lib/cx";
import type { ThemeChoice } from "../theme";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderProps {
  /** The official logo element (an <img>). Falls back to "NSBM Green University" in plain type. */
  logo?: ReactNode;
  homeHref?: string;
  /** Called on a plain click of the logo so the app can navigate without a page load. */
  onHome?: () => void;
  /** Default "Faculty of Computing". Pass null to hide. */
  title?: ReactNode;
  /** Optional: Home, About This Tool. Nothing more. */
  links?: Array<{ label: string; href: string }>;
  theme?: ThemeChoice;
  onThemeChange?: (value: ThemeChoice) => void;
  /** Replaces the theme toggle slot. */
  end?: ReactNode;
  className?: string;
}

export function Header({
  logo,
  homeHref = "/",
  onHome,
  title = "Faculty of Computing",
  links = [],
  theme,
  onThemeChange,
  end,
  className,
}: HeaderProps) {
  function handleHomeClick(event: MouseEvent<HTMLAnchorElement>) {
    const plainClick = event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
    if (!onHome || !plainClick) return;
    event.preventDefault();
    onHome();
  }

  return (
    <header className={cx("np-header", className)}>
      <div className="np-header-inner">
        <a className="np-logo" href={homeHref} aria-label="NSBM Green University, home" onClick={handleHomeClick}>
          {logo ?? <span className="np-logo-text">NSBM Green University</span>}
        </a>
        {title ? <span className="np-header-title">{title}</span> : null}
        {links.length > 0 ? (
          <nav className="np-header-links" aria-label="Main">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="np-header-end">
          {end !== undefined ? end : <ThemeToggle value={theme} onChange={onThemeChange} />}
        </div>
      </div>
    </header>
  );
}
