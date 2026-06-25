import { useTranslation } from "react-i18next";
import { CalendarClock, Paperclip, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import type { Task, Project, TaskStatus } from "../data/types.js";
import { PriorityBadge } from "./PriorityBadge.js";

const COLUMNS: { key: TaskStatus; labelKey: string }[] = [
  { key: "pending", labelKey: "tasks.status.pending" },
  { key: "in_progress", labelKey: "tasks.status.in_progress" },
  { key: "blocked", labelKey: "tasks.status.blocked" },
  { key: "completed", labelKey: "tasks.status.completed" }
];

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(`${dueDate}T23:59:59`) < new Date();
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short"
  });
}

interface KanbanCardProps {
  task: Task;
  project: Project | undefined;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
}

function KanbanCard({ task, project, onEdit }: KanbanCardProps) {
  const { t } = useTranslation("gestion-jornada");

  const completedSubs = task.subtasks.filter((s) => s.status === "completed").length;
  const activeAttachments = task.attachments.filter((a) => !a.isDeleted).length;
  const overdue = isOverdue(task.dueDate) && task.status !== "completed";

  return (
    <article
      className={[
        "jornada-kanban-card",
        `jornada-kanban-card--priority-${task.priority}`,
        task.status === "completed" ? "jornada-kanban-card--done" : ""
      ].join(" ")}
      onClick={() => onEdit(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit(task);
      }}
      aria-label={`${t("tasks.title")}: ${task.title}`}
    >
      <div className="jornada-kanban-card__top">
        <h4 className="jornada-kanban-card__title">{task.title}</h4>
      </div>

      {project && (
        <span className="jornada-kanban-card__project">{project.name}</span>
      )}

      <div className="jornada-kanban-card__badges">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="jornada-kanban-card__meta">
        {task.dueDate && (
          <span className={`jornada-kanban-card__meta-item${overdue ? " jornada-kanban-card__meta-item--overdue" : ""}`}>
            <CalendarClock size={11} aria-hidden="true" />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="jornada-kanban-card__meta-item">
            <CheckSquare size={11} aria-hidden="true" />
            {completedSubs}/{task.subtasks.length}
          </span>
        )}
        {activeAttachments > 0 && (
          <span className="jornada-kanban-card__meta-item">
            <Paperclip size={11} aria-hidden="true" />
            {activeAttachments}
          </span>
        )}
        <Link
          to={`/jornada/tareas/${task.id}`}
          className="jornada-kanban-card__meta-item"
          style={{ marginLeft: "auto", color: "#116c65", fontSize: "0.65rem", fontWeight: 600 }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Ver detalle de ${task.title}`}
        >
          Ver
        </Link>
      </div>
    </article>
  );
}

export function KanbanBoard({ tasks, projects, onChangeStatus, onEdit }: KanbanBoardProps) {
  const { t } = useTranslation("gestion-jornada");

  return (
    <div className="jornada-board" role="region" aria-label={t("board.title")}>
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((tk) => tk.status === col.key);
        return (
          <div
            key={col.key}
            className={`jornada-kanban-col jornada-kanban-col--${col.key}`}
            role="group"
            aria-label={t(col.labelKey)}
          >
            <div className="jornada-kanban-col__header">
              <h3 className="jornada-kanban-col__title">
                <span className="jornada-kanban-col__dot" aria-hidden="true" />
                {t(col.labelKey)}
              </h3>
              <span className="jornada-kanban-col__count" aria-label={`${colTasks.length} tareas`}>
                {colTasks.length}
              </span>
            </div>

            <div className="jornada-kanban-col__cards">
              {colTasks.length === 0 ? (
                <div style={{ padding: "0.5rem", textAlign: "center", color: "#adb5bd", fontSize: "0.75rem" }}>
                  {t("board.empty")}
                </div>
              ) : (
                colTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      project={project}
                      onChangeStatus={onChangeStatus}
                      onEdit={onEdit}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
