import { useTranslation } from "react-i18next";

export function DemoBanner() {
  const { t } = useTranslation("common");
  return (
    <div className="demo-banner" role="status">
      <span aria-hidden="true">⚠️</span>
      <p>{t("demoBanner.message")}</p>
    </div>
  );
}
