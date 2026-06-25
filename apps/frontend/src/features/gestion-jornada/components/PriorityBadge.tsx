import { useTranslation } from "react-i18next";
import type { Priority } from "../data/types.js";

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useTranslation("gestion-jornada");
  return (
    <span className={`jornada-badge jornada-badge--priority-${priority}`}>
      {t(`tasks.priority.${priority}`)}
    </span>
  );
}
