import { useTranslation } from "react-i18next";
import type { TaskStatus, SubtaskStatus, ProjectStatus } from "../data/types.js";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const { t } = useTranslation("gestion-jornada");
  return (
    <span className={`jornada-badge jornada-badge--project-${status}`}>
      {t(`projects.status.${status}`)}
    </span>
  );
}

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const { t } = useTranslation("gestion-jornada");
  return (
    <span className={`jornada-badge jornada-badge--task-${status}`}>
      {t(`tasks.status.${status}`)}
    </span>
  );
}

interface SubtaskStatusBadgeProps {
  status: SubtaskStatus;
}

export function SubtaskStatusBadge({ status }: SubtaskStatusBadgeProps) {
  const { t } = useTranslation("gestion-jornada");
  return (
    <span className={`jornada-badge jornada-badge--subtask-${status}`}>
      {t(`subtasks.status.${status}`)}
    </span>
  );
}
