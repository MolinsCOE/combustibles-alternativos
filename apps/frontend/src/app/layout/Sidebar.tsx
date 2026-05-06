import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Info, Shield, Users, KeyRound, Flame, LayoutDashboard, ClipboardList, Truck, CheckSquare, Activity, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher.js";

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
};

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { t } = useTranslation("common");
  const { t: tComb } = useTranslation("combustibles");
  const [adminOpen, setAdminOpen] = useState(true);
  const [combustiblesOpen, setCombustiblesOpen] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);

  // Auto-expand groups based on current path
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/administracion")) {
        setAdminOpen(true);
      }
      if (window.location.pathname.startsWith("/combustibles")) {
        setCombustiblesOpen(true);
      }
    }
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "sidebar__link sidebar__link--active" : "sidebar__link";

  return (
    <aside
      ref={panelRef}
      className={open ? "sidebar sidebar--open" : "sidebar"}
      aria-label={t("nav.primaryAria")}
    >
      <div className="sidebar__brand">
        <img
          src="/brand/molins-logo.png"
          alt={t("app.name")}
          className="sidebar__logo"
        />
      </div>

      <nav className="sidebar__nav" aria-label={t("nav.aria")}>
        <ul className="sidebar__list">
          <li>
            <NavLink to="/" end className={navLinkClass} onClick={onNavigate}>
              <Home size={20} aria-hidden="true" />
              <span>{t("nav.home")}</span>
            </NavLink>
          </li>

          <li>
            <button
              type="button"
              className="sidebar__group-toggle"
              aria-expanded={adminOpen}
              aria-controls="sidebar-admin-submenu"
              onClick={() => setAdminOpen((v) => !v)}
            >
              <Shield size={20} aria-hidden="true" />
              <span>{t("nav.administration")}</span>
              <span
                className={
                  adminOpen
                    ? "sidebar__chevron sidebar__chevron--open"
                    : "sidebar__chevron"
                }
                aria-hidden="true"
              >
                ▸
              </span>
            </button>
            {adminOpen && (
              <ul id="sidebar-admin-submenu" className="sidebar__sublist">
                <li>
                  <NavLink
                    to="/administracion/usuarios"
                    className={navLinkClass}
                    onClick={onNavigate}
                  >
                    <Users size={20} aria-hidden="true" />
                    <span>{t("nav.users")}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/administracion/roles"
                    className={navLinkClass}
                    onClick={onNavigate}
                  >
                    <KeyRound size={20} aria-hidden="true" />
                    <span>{t("nav.roles")}</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              type="button"
              className="sidebar__group-toggle"
              aria-expanded={combustiblesOpen}
              aria-controls="sidebar-combustibles-submenu"
              onClick={() => setCombustiblesOpen((v) => !v)}
            >
              <Flame size={20} aria-hidden="true" />
              <span>{tComb("nav.module")}</span>
              <span
                className={
                  combustiblesOpen
                    ? "sidebar__chevron sidebar__chevron--open"
                    : "sidebar__chevron"
                }
                aria-hidden="true"
              >
                ▸
              </span>
            </button>
            {combustiblesOpen && (
              <ul id="sidebar-combustibles-submenu" className="sidebar__sublist">
                <li>
                  <NavLink to="/combustibles" end className={navLinkClass} onClick={onNavigate}>
                    <LayoutDashboard size={16} aria-hidden="true" />
                    <span>{tComb("nav.dashboard")}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/combustibles/solicitud" className={navLinkClass} onClick={onNavigate}>
                    <ClipboardList size={16} aria-hidden="true" />
                    <span>{tComb("nav.solicitud")}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/combustibles/distribucion" className={navLinkClass} onClick={onNavigate}>
                    <Truck size={16} aria-hidden="true" />
                    <span>{tComb("nav.distribucion")}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/combustibles/confirmacion" className={navLinkClass} onClick={onNavigate}>
                    <CheckSquare size={16} aria-hidden="true" />
                    <span>{tComb("nav.confirmacion")}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/combustibles/seguimiento" className={navLinkClass} onClick={onNavigate}>
                    <Activity size={16} aria-hidden="true" />
                    <span>{tComb("nav.seguimiento")}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/combustibles/maestros" className={navLinkClass} onClick={onNavigate}>
                    <Settings size={16} aria-hidden="true" />
                    <span>{tComb("nav.maestros")}</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          <li>
            <NavLink
              to="/informacion"
              className={navLinkClass}
              onClick={onNavigate}
            >
              <Info size={20} aria-hidden="true" />
              <span>{t("nav.information")}</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar__footer">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
