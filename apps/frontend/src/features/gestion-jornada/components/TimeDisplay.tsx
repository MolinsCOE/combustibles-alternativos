import { useTranslation } from "react-i18next";

interface TimeDisplayProps {
  minutes: number | null;
}

export function TimeDisplay({ minutes }: TimeDisplayProps) {
  const { t } = useTranslation("gestion-jornada");

  if (!minutes || minutes <= 0) return null;

  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return <span>{t("tasks.timeDisplay.hours", { h, m })}</span>;
  }

  return <span>{t("tasks.timeDisplay.minutes", { m: minutes })}</span>;
}
