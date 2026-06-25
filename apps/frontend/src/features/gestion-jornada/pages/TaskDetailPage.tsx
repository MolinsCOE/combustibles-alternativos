import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Edit2, ChevronRight, Clock, CalendarClock, CalendarCheck, FolderKanban } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useGestionJornadaContext } from "../hooks/GestionJornadaContext.js";
import { TaskStatusBadge } from "../components/StatusBadge.js";
import { PriorityBadge } from "../components/PriorityBadge.js";
import { TimeDisplay } from "../components/TimeDisplay.js";
import { SubtaskList } from "../components/SubtaskList.js";
import { AttachmentList } from "../components/AttachmentList.js";
import { TaskForm } from "../components/TaskForm.js";
import type { TaskStatus } from "../data/types.js";
import type { UpdateTaskInput, CreateSubtaskInput } from "../hooks/useGestionJornada.js";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");

  const {
    projects,
    tasks,
    updateTask,
    changeTaskStatus,
    createSubtask,
    changeSubtaskStatus,
    addAttachment,
    deleteAttachment
  } = useGestionJornadaContext();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const task = tasks.find((tk) => tk.id === id);
  const project = task ? projects.find((p) => p.id === task.projectId) : undefined;

  if (!task) {
    return (
      <div className="jornada-page">
        <div className="jornada-header">
          <button type="button" className="jornada-btn jornada-btn--ghost jornada-btn--sm" onClick={() => { void navigate(-1); }}>
            <ArrowLeft size={14} aria-hidden="true" />
            {tCommon("actions.cancel")}
          </button>
        </div>
        <div className="jornada-content">
          <div className="jornada-empty"><p>Tarea no encontrada.</p></div>
        </div>
      </div>
    );
  }

  function handleStatusChange(status: TaskStatus) {
    changeTaskStatus(task!.id, status);
  }

  function handleSaveEdit(data: UpdateTaskInput) {
    updateTask(task!.id, data);
    setEditing(false);
  }

  function handleAddSubtask(taskId: string, input: CreateSubtaskInput) {
    createSubtask(taskId, input);
  }

  function handleConfirmDeleteAttachment(attId: string, fileName: string) {
    setConfirmDelete({ id: attId, name: fileName });
  }

  function doDeleteAttachment() {
    if (confirmDelete) {
      deleteAttachment(task!.id, confirmDelete.id);
      setConfirmDelete(null);
    }
  }

  const isCompleted = task.status === "completed";
  const isBlocked = task.status === "blocked";

  const completedSubs = task.subtasks.filter((s) => s.status === "completed").length;

  return (
    <div className="jornada-page">
      <DemoBanner />

      {/* Header */}
      <div className="jornada-header">
        <div className="jornada-header__left">
          <button
            type="button"
            className="jornada-btn--icon-ghost"
            onClick={() => { void navigate(-1); }}
            aria-label="Volver"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <span className="jornada-breadcrumb">
            <Link to="/jornada/proyectos" className="jornada-breadcrumb__item">
              {t("projects.title")}
            </Link>
            {project && (
              <>
                <ChevronRight size={12} className="jornada-breadcrumb__sep" aria-hidden="true" />
                <Link to={`/jornada/proyectos/${project.id}`} className="jornada-breadcrumb__item">
                  {project.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="jornada-breadcrumb__sep" aria-hidden="true" />
            <span className="jornada-breadcrumb__current">{task.title}</span>
          </span>
        </div>
        {!editing && (
          <div className="jornada-header__right">
            <button
              type="button"
              className="jornada-btn jornada-btn--ghost jornada-btn--sm"
              onClick={() => setEditing(true)}
            >
              <Edit2 size={13} aria-hidden="true" />
              {tCommon("actions.edit")}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="jornada-content">
        {editing ? (
          <div className="jornada-task-detail">
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f3f5" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2c3030", margin: 0 }}>
                {t("tasks.form.editTitle")}
              </h2>
            </div>
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <TaskForm
                initial={task}
                projects={projects}
                onSave={(data) => handleSaveEdit(data as UpdateTaskInput)}
                onCancel={() => setEditing(false)}
              />
            </div>
          </div>
        ) : (
          <div className="jornada-task-detail">
            {/* Hero */}
            <div className="jornada-task-detail__hero">
              <div className="jornada-task-detail__badges">
                <TaskStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>

              <h1 className="jornada-task-detail__title">{task.title}</h1>

              {project && (
                <Link
                  to={`/jornada/proyectos/${project.id}`}
                  className="jornada-task-detail__project-link"
                >
                  <FolderKanban size={13} aria-hidden="true" />
                  {project.name}
                </Link>
              )}

              <div className="jornada-task-detail__actions">
                {!isCompleted ? (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--success jornada-btn--sm"
                    onClick={() => handleStatusChange("completed")}
                  >
                    {t("tasks.actions.complete")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--ghost jornada-btn--sm"
                    onClick={() => handleStatusChange("in_progress")}
                  >
                    {t("tasks.actions.reopen")}
                  </button>
                )}

                {!isCompleted && !isBlocked && (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--danger-ghost jornada-btn--sm"
                    onClick={() => handleStatusChange("blocked")}
                  >
                    {t("tasks.actions.block")}
                  </button>
                )}

                {isBlocked && (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--ghost jornada-btn--sm"
                    onClick={() => handleStatusChange("in_progress")}
                  >
                    {t("tasks.actions.reopen")}
                  </button>
                )}
              </div>
            </div>

            {/* Body: main + sidebar */}
            <div className="jornada-task-detail__body">
              {/* Main */}
              <div className="jornada-task-detail__main">
                {task.description && (
                  <div>
                    <h3 className="jornada-task-detail__section-title">{t("tasks.fields.description")}</h3>
                    <p className="jornada-task-detail__description">{task.description}</p>
                  </div>
                )}

                {/* Subtasks */}
                <SubtaskList
                  subtasks={task.subtasks}
                  taskId={task.id}
                  onAddSubtask={handleAddSubtask}
                  onChangeStatus={changeSubtaskStatus}
                />

                {/* Attachments */}
                <AttachmentList
                  attachments={task.attachments}
                  taskId={task.id}
                  onAdd={addAttachment}
                  onDelete={deleteAttachment}
                  onConfirmDelete={handleConfirmDeleteAttachment}
                />
              </div>

              {/* Sidebar meta */}
              <aside className="jornada-task-detail__sidebar">
                <div className="jornada-meta-grid">
                  <div className="jornada-meta-item">
                    <span className="jornada-meta-item__label">{t("tasks.fields.date")}</span>
                    <span className="jornada-meta-item__value">
                      {new Date(`${task.taskDate}T12:00:00`).toLocaleDateString("es-ES", {
                        weekday: "long", day: "numeric", month: "long"
                      })}
                    </span>
                  </div>

                  {task.timeSpentMinutes != null && task.timeSpentMinutes > 0 && (
                    <div className="jornada-meta-item">
                      <span className="jornada-meta-item__label">
                        <Clock size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.2rem" }} />
                        {t("tasks.fields.timeSpent")}
                      </span>
                      <span className="jornada-meta-item__value">
                        <TimeDisplay minutes={task.timeSpentMinutes} />
                      </span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="jornada-meta-item">
                      <span className="jornada-meta-item__label">
                        <CalendarClock size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.2rem" }} />
                        {t("tasks.fields.dueDate")}
                      </span>
                      <span className="jornada-meta-item__value">
                        {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}

                  {task.closedAt && (
                    <div className="jornada-meta-item">
                      <span className="jornada-meta-item__label">
                        <CalendarCheck size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.2rem" }} />
                        {t("tasks.fields.closedAt")}
                      </span>
                      <span className="jornada-meta-item__value">
                        {new Date(task.closedAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}

                  {task.subtasks.length > 0 && (
                    <div className="jornada-meta-item">
                      <span className="jornada-meta-item__label">Subtareas</span>
                      <span className="jornada-meta-item__value">
                        {completedSubs}/{task.subtasks.length} completadas
                      </span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmar eliminar adjunto */}
      {confirmDelete && (
        <div className="jornada-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-del-att-title">
          <div className="jornada-modal jornada-modal--sm">
            <div className="jornada-modal__header">
              <h2 className="jornada-modal__title" id="modal-del-att-title">{t("attachments.actions.delete")}</h2>
            </div>
            <p className="jornada-modal__body">
              {t("attachments.actions.deleteConfirm", { name: confirmDelete.name })}
            </p>
            <div className="jornada-form__actions">
              <button
                type="button"
                className="jornada-btn jornada-btn--ghost"
                onClick={() => setConfirmDelete(null)}
              >
                {tCommon("actions.cancel")}
              </button>
              <button
                type="button"
                className="jornada-btn jornada-btn--danger"
                onClick={doDeleteAttachment}
              >
                {tCommon("actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
