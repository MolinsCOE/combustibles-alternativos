import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar.js";
import { TopBar } from "./TopBar.js";

type AppLayoutProps = {
  children: ReactNode;
};

const MOBILE_MEDIA_QUERY = "(max-width: 1023.98px)";

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Cerrar el drawer al navegar (solo afecta movil/tablet).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Al cerrar el drawer en movil, devolver el foco al boton hamburguesa.
  useEffect(() => {
    if (wasOpenRef.current && !mobileOpen && isMobile) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = mobileOpen;
  }, [mobileOpen, isMobile]);

  const drawerInert = isMobile && !mobileOpen;

  return (
    <div className={mobileOpen ? "shell shell--drawer-open" : "shell"}>
      <TopBar onOpenMenu={() => setMobileOpen(true)} buttonRef={menuButtonRef} />
      <button
        type="button"
        className={
          mobileOpen
            ? "shell__backdrop shell__backdrop--visible"
            : "shell__backdrop"
        }
        aria-label={t("nav.closeMenu")}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={
          mobileOpen ? "shell__drawer shell__drawer--open" : "shell__drawer"
        }
        inert={drawerInert}
      >
        <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      </div>
      <main className="shell__main">{children}</main>
    </div>
  );
}

