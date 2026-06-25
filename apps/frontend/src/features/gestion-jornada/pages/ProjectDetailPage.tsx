import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, List, BarChart2, LayoutGrid, ChevronRight } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useGestionJornadaContext } from "../hooks/GestionJornadaContext.js";
import { ProjectStatusBadge } from "../components/StatusBadge.js";
import { TaskForm } from "../components/TaskForm.js";
import { KanbanBoard } from "../components/KanbanBoard.js";
import type { Task, TaskStatus } from "../data/types.js";
import type { CreateTaskInput, UpdateTaskInput } from "../hooks/useGestionJornada.js";

type ViewMode = "list" | "board" | "gantt";
type Modal = { type: "create" } | { type: "edit"; task: Task } | null;

/* ---- Gantt helpers ---- */
function parseDay(iso: string): number {
  return new Date(`${iso}T12:00:00`).getTime();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildGanttRange(tasks: Task[]): { start: number; end: number; totalDays: number } {
  const dates = tasks.flatMap((t) => {
    const points = [parseDay(t.createdAt.slice(0, 10))];
    if (t.dueDate) points.push(parseDay(t.dueDate));
    return points;
  });
  const today = parseDay(todayIso());
  dates.push(today);

  const start = Math.min(...dates);
  const end = Math.max(...dates);
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
  return { start, end, totalDays };
}

function ganttBarStyle(task: Task, rangeStart: number, totalDays: number): { left: string; width: string } {
  const taskStart = parseDay(task.createdAt.slice(0, 10));
  const taskEnd = task.dueDate ? parseDay(task.dueDate) : taskStart;
  const leftPct = ((taskStart - rangeStart) / (totalDays * 86400000)) * 100;
  const widthPct = Math.max(1, ((taskEnd - taskStart) / (totalDays * 86400000)) * 100);
  return {
    left: `${Math.max(0, leftPct)}%`,
    width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`
  };
}

function todayLineLeft(rangeStart: number, totalDays: number): string {
  const todayMs = parseDay(todayIso());
  const pct = ((todayMs - rangeStart) / (totalDays * 86400000)) * 100;
  if (pct < 0 || pct > 100) return "-1000px";
  return `${pct}%`;
}

/* ---- List row ---- */
function TaskListRow({ task, project, onEdit }: { task: Task; project: { name: string } | undefined; onEdit: (t: Task) => void }) {
  const { t } = useTranslation("gestion-jornada");
  const priorities: Record<string, string> = { high: "Alta", medium: "Normal", low: "Baja" };
  const statusLabels: Record<string, string> = {
    pending: t("tasks.status.pending"),
    in_progress: t("tasks.status.in_progress"),
    blocked: t("tasks.status.blocked"),
    completed: t("tasks.status.completed")
  };

  return (
    <div
      className={`jornada-task-row${task.status === "completed" ? " jornada-task-row--done" : ""}`}
      onClick={() => onEdit(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEdit(task); }}
    >
      <span className={`jornada-task-row__priority-dot jornada-task-row__priority-dot--${task.priority}`} aria-hidden="true" />
      <div className="jornada-task-row__content">
        <p className="jornada-task-row__title">{task.title}</p>
        {project && <span style={{ fontSize: "0.7rem", color: "#116c65", fontWeight: 500 }}>{project.name}</span>}
      </div>
      <div className="jornada-task-row__meta">
        <span style={{ fontSize: "0.7rem", color: "#616666" }}>{statusLabels[task.status]}</span>
        <span style={{ fontSize: "0.7rem", color: "#616666" }}>{priorities[task.priority]}</span>
        {task.dueDate && (
          <span style={{ fontSize: "0.7rem", color: "#616666" }}>
            {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("es-ES")}
          </span>
        )}
      </div>
      <div className="jornada-task-row__actions">
        <Link
          to={`/jornada/tareas/${task.id}`}
          className="jornada-btn jornada-btn--ghost jornada-btn--sm"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Ver detalle de ${task.title}`}
        >
          Ver
        </Link>
      </div>
    </div>
  );
}

/* ---- Gantt view ---- */
function GanttView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  const { start, totalDays } = buildGanttRange(tasks);
  const LABEL_W = 220;

  return (
    <div className="jornada-gantt" style={{ overflowX: "auto" }}>
      {/* Header */}
      <div
        className="jornada-gantt__header"
        style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px 1fr` }}
      >
        <div className="jornada-gantt__header-task">Tarea</div>
        <div style={{ position: "relative", height: "32px", minWidth: "400px" }}>
          <div
            className="jornada-gantt__today-line"
            style={{ left: todayLineLeft(start, totalDays) }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Rows */}
      {tasks.map((task) => {
        const { left, width } = ganttBarStyle(task, start, totalDays);
        return (
          <div
            key={task.id}
            className="jornada-gantt__row"
            style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px 1fr` }}
          >
            <div className="jornada-gantt__task-label">
              <span className="jornada-gantt__task-name">{task.title}</span>
              {task.dueDate && (
                <span className="jornada-gantt__task-sub">
                  Límite: {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("es-ES")}
                </span>
              )}
            </div>
            <div className="jornada-gantt__timeline" style={{ position: "relative", minWidth: "400px" }}>
              <div
                className="jornada-gantt__today-line"
                style={{ left: todayLineLeft(start, totalDays) }}
                aria-hidden="true"
              />
              <div
                className={`jornada-gantt__bar-wrap jornada-gantt__bar--${task.status}`}
                style={{ left, width }}
                title={task.title}
                role="img"
                aria-label={`${task.title}: ${task.status}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Main component ---- */
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("gestion-jornada");

  const { projects, tasks, createTask, updateTask, changeTaskStatus } = useGestionJornadaContext();

  const [modal, setModal] = useState<Modal>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const project = projects.find((p) => p.id === id);
  const projectTasks = tasks.filter((t) => t.projectId === id);
  const filteredTasks = statusFilter === "all" ? projectTasks : projectTasks.filter((t) => t.status === statusFilter);

  if (!project) {
    return (
      <div className="jornada-page">
        <div className="jornada-header">
          <button type="button" className="jornada-btn jornada-btn--ghost jornada-btn--sm" onClick={() => { void navigate(-1); }}>
            <ArrowLeft size={14} aria-hidden="true" />
            {t("projects.title")}
          </button>
        </div>
        <div className="jornada-content">
          <div className="jornada-empty"><p>Proyecto no encontrado.</p></div>
        </div>
      </div>
    );
  }

  function handleSave(data: CreateTaskInput | UpdateTaskInput) {
    if (modal?.type === "create") {
      const today = new Date().toISOString().slice(0, 10);
      createTask({ ...(data as CreateTaskInput), projectId: project!.id, taskDate: today });
    } else if (modal?.type === "edit") {
      updateTask(modal.task.id, data as UpdateTaskInput);
    }
    setModal(null);
  }

  function handleEditTask(task: Task) {
    setModal({ type: "edit", task });
  }

  const statusFilters: Array<"all" | TaskStatus> = ["all", "pending", "in_progress", "blocked", "completed"];
  const statusLabel = (s: string): string => {
    if (s === "all") return "Todas";
    return t(`tasks.status.${s}`);
  };

  return (
    <div className="jornada-page">
      <DemoBanner />

      {/* Header */}
      <div className="jornada-header">
        <div className="jornada-header__left">
          <Link to="/jornada/proyectos" className="jornada-btn--icon-ghost" aria-label={t("projects.title")}>
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <span className="jornada-breadcrumb">
            <Link to="/jornada/proyectos" className="jornada-breadcrumb__item">{t("projects.title")}</Link>
            <ChevronRight size={12} className="jornada-breadcrumb__sep" aria-hidden="true" />
            <span className="jornada-breadcrumb__current">{project.name}</span>
          </span>
          <ProjectStatusBadge status={project.status} />
        </div>
        <div className="jornada-header__right">
          {project.status === "open" && (
            <button
              type="button"
              className="jornada-btn jornada-btn--primary"
              onClick={() => setModal({ type: "create" })}
            >
              <Plus size={15} aria-hidden="true" />
              {t("tasks.new")}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="jornada-toolbar">
        {statusFilters.map((f) => (
          <button
            key={f}
            type="button"
            className={`jornada-filter-btn${statusFilter === f ? " jornada-filter-btn--active" : ""}`}
            onClick={() => setStatusFilter(f)}
          >
            {statusLabel(f)}
          </button>
        ))}
        <div className="jornada-toolbar__spacer" />
        {/* Toggle vista */}
        <div className="jornada-view-toggle" role="group" aria-label="Vista">
          <button
            type="button"
            className={`jornada-view-toggle__btn${view === "list" ? " jornada-view-toggle__btn--active" : ""}`}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            title="Vista lista"
          >
            <List size={13} aria-hidden="true" />
            Lista
          </button>
          <button
            type="button"
            className={`jornada-view-toggle__btn${view === "board" ? " jornada-view-toggle__btn--active" : ""}`}
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
            title="Vista tablero"
          >
            <LayoutGrid size={13} aria-hidden="true" />
            Tablero
          </button>
          <button
            type="button"
            className={`jornada-view-toggle__btn${view === "gantt" ? " jornada-view-toggle__btn--active" : ""}`}
            onClick={() => setView("gantt")}
            aria-pressed={view === "gantt"}
            title="Vista Gantt"
          >
            <BarChart2 size={13} aria-hidden="true" />
            Gantt
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={view === "board" ? "jornada-content jornada-content--board" : "jornada-content"}>
        {/* Project description */}
        {project.description && (
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#616666", lineHeight: 1.5 }}>
            {project.description}
          </p>
        )}

        {filteredTasks.length === 0 ? (
          <div className="jornada-empty">
            <p>{t("projects.detail.noTasks")}</p>
          </div>
        ) : view === "list" ? (
          <div className="jornada-task-list">
            {filteredTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                project={project}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        ) : view === "board" ? (
          <KanbanBoard
            tasks={filteredTasks}
            projects={projects}
            onChangeStatus={changeTaskStatus}
            onEdit={handleEditTask}
          />
        ) : (
          <GanttView tasks={filteredTasks} />
        )}
      </div>

      {/* Modal */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <div className="jornada-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-task-title">
          <div className="jornada-modal jornada-modal--lg">
            <div className="jornada-modal__header">
              <h2 className="jornada-modal__title" id="modal-task-title">
                {modal.type === "create" ? t("tasks.form.createTitle") : t("tasks.form.editTitle")}
              </h2>
              <button type="button" className="jornada-btn--icon-ghost" onClick={() => setModal(null)} aria-label="Cerrar">✕</button>
            </div>
            <TaskForm
              initial={modal.type === "edit" ? modal.task : undefined}
              projects={projects}
              onSave={handleSave}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
