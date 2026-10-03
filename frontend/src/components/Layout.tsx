import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LOGO_HEIGHT, LOGO_SRC, LOGO_WIDTH } from "../config";
import { useTheme } from "../hooks/useTheme";
import { Header } from "./Header";

/** Header, skip link and the page outlet shared by every screen. */
export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [theme, setTheme] = useTheme();

  // Each screen starts at the top, as a page load would.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // In dark mode the unaltered logo sits on a small light panel (see styles/app.css).
  const logo = LOGO_SRC ? (
    <span className="app-logo-panel">
      <img src={LOGO_SRC} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="NSBM Green University" />
    </span>
  ) : undefined;

  return (
    <>
      <a className="app-skip-link" href="#main">
        Skip to content
      </a>
      <Header logo={logo} onHome={() => navigate("/")} theme={theme} onThemeChange={setTheme} />
      <main id="main" className="app-main">
        <Outlet />
      </main>
    </>
  );
}
