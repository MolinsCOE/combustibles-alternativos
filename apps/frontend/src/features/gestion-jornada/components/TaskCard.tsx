import { useTranslation } from "react-i18next";
import { Clock, CalendarClock, Paperclip, CheckSquare, Edit2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Task, Project, TaskStatus } from "../data/types.js";
import { TaskStatusBadge } from "./StatusBadge.js";
import { PriorityBadge } from "./PriorityBadge.js";
import { TimeDisplay } from "./TimeDisplay.js";

interface TaskCardProps {
  task: Task;
  project: Project | undefined;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, project, onChangeStatus, onEdit }: TaskCardProps) {
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");

  const completedSubtasks = task.subtasks.filter((s) => s.status === "completed").length;
  const activeAttachments = task.attachments.filter((a) => !a.isDeleted).length;
  const isCompleted = task.status === "completed";

  function handleQuickComplete() {
    if (isCompleted) {
      onChangeStatus(task.id, "in_progress");
    } else {
      onChangeStatus(task.id, "completed");
    }
  }

  return (
    <article className={`jornada-task-card${isCompleted ? " jornada-task-card--done" : ""} jornada-task-card--priority-${task.priority}`}>
      <header className="jornada-task-card__header">
        <div className="jornada-task-card__badges">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="jornada-task-card__title-row">
          <h3 className="jornada-task-card__title">{task.title}</h3>
        </div>
        {project && (
          <span className="jornada-task-card__project">{project.name}</span>
        )}
      </header>

      {task.description && (
        <p className="jornada-task-card__desc">{task.description}</p>
      )}

      <div className="jornada-task-card__meta">
        {task.timeSpentMinutes != null && task.timeSpentMinutes > 0 && (
          <span className="jornada-task-card__meta-item">
            <Clock size={14} aria-hidden="true" />
            <TimeDisplay minutes={task.timeSpentMinutes} />
          </span>
        )}
        {task.dueDate && (
          <span className="jornada-task-card__meta-item">
            <CalendarClock size={14} aria-hidden="true" />
            {new Date(task.dueDate).toLocaleDateString("es-ES")}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="jornada-task-card__meta-item">
            <CheckSquare size={14} aria-hidden="true" />
            {completedSubtasks}/{task.subtasks.length}
          </span>
        )}
        {activeAttachments > 0 && (
          <span className="jornada-task-card__meta-item">
            <Paperclip size={14} aria-hidden="true" />
            {activeAttachments}
          </span>
        )}
      </div>

      <footer className="jornada-task-card__actions">
        <button
          type="button"
          className="jornada-btn jornada-btn--ghost jornada-btn--sm"
          onClick={() => onEdit(task)}
          aria-label={`${tCommon("actions.edit")}: ${task.title}`}
        >
          <Edit2 size={14} aria-hidden="true" />
          {tCommon("actions.edit")}
        </button>

        <button
          type="button"
          className={`jornada-btn jornada-btn--sm ${isCompleted ? "jornada-btn--ghost" : "jornada-btn--success"}`}
          onClick={handleQuickComplete}
          aria-label={isCompleted ? t("tasks.actions.reopen") : t("tasks.actions.complete")}
        >
          {isCompleted ? t("tasks.actions.reopen") : t("tasks.actions.complete")}
        </button>

        <Link
          to={`/jornada/tareas/${task.id}`}
          className="jornada-btn jornada-btn--ghost jornada-btn--sm"
          aria-label={`Ver detalle: ${task.title}`}
        >
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
