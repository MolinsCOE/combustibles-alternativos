import { useTranslation } from "react-i18next";
import { useHealth } from "../hooks/use-health.js";

export function HealthStatus() {
  const { t } = useTranslation("health");
  const state = useHealth();

  if (state.kind === "loading") {
    return <span>{t("loading")}</span>;
  }
  if (state.kind === "error") {
    return <span className="status-error">{t("status.error")}</span>;
  }
  return (
    <span className="status-ok">
      {state.data.status === "ok" ? t("status.ok") : t("status.error")}
    </span>
  );
}
