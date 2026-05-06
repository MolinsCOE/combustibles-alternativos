import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";

type TopBarProps = {
  onOpenMenu: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
};

export function TopBar({ onOpenMenu, buttonRef }: TopBarProps) {
  const { t } = useTranslation("common");
  return (
    <header className="topbar">
      <button
        ref={buttonRef}
        type="button"
        className="topbar__menu-button"
        aria-label={t("nav.openMenu")}
        onClick={onOpenMenu}
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="topbar__brand">
        <img
          src="/brand/molins-logo.png"
          alt={t("app.name")}
          className="topbar__logo"
        />
      </div>
    </header>
  );
}

