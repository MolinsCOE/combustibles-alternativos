import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Task, Priority, TaskStatus } from "../data/types.js";
import type { Project } from "../data/types.js";
import type { CreateTaskInput, UpdateTaskInput } from "../hooks/useGestionJornada.js";

interface TaskFormProps {
  initial?: Task;
  projects: Project[];
  defaultDate?: string;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => void;
  onCancel: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TaskForm({
  initial,
  projects,
  defaultDate,
  onSave,
  onCancel
}: TaskFormProps) {
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");

  const openProjects = projects.filter((p) => p.status === "open");

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [projectId, setProjectId] = useState(initial?.projectId ?? (openProjects[0]?.id ?? ""));
  const [taskDate, setTaskDate] = useState(initial?.taskDate ?? (defaultDate ?? todayIso()));
  const [timeSpent, setTimeSpent] = useState(
    initial?.timeSpentMinutes != null ? String(initial.timeSpentMinutes) : ""
  );
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "pending");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs["title"] = t("tasks.form.errors.titleRequired");
    if (!projectId) errs["projectId"] = t("tasks.form.errors.projectRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const minutes = timeSpent.trim() ? parseInt(timeSpent, 10) : null;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      projectId,
      taskDate,
      timeSpentMinutes: minutes && !isNaN(minutes) ? minutes : null,
      priority,
      status,
      dueDate: dueDate || null
    });
  }

  return (
    <form className="jornada-form" onSubmit={handleSubmit} noValidate>
      <div className="jornada-form__field">
        <label className="jornada-form__label" htmlFor="task-title">
          {t("tasks.fields.title")} <span aria-hidden="true">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          className={`jornada-form__input${errors["title"] ? " jornada-form__input--error" : ""}`}
          placeholder={t("tasks.fields.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        {errors["title"] && (
          <span className="jornada-form__error" role="alert">
            {errors["title"]}
          </span>
        )}
      </div>

      <div className="jornada-form__field">
        <label className="jornada-form__label" htmlFor="task-project">
          {t("tasks.fields.project")} <span aria-hidden="true">*</span>
        </label>
        <select
          id="task-project"
          className={`jornada-form__select${errors["projectId"] ? " jornada-form__input--error" : ""}`}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">{t("tasks.fields.projectPlaceholder")}</option>
          {openProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors["projectId"] && (
          <span className="jornada-form__error" role="alert">
            {errors["projectId"]}
          </span>
        )}
      </div>

      <div className="jornada-form__row">
        <div className="jornada-form__field">
          <label className="jornada-form__label" htmlFor="task-date">
            {t("tasks.fields.date")}
          </label>
          <input
            id="task-date"
            type="date"
            className="jornada-form__input"
            value={taskDate}
            onChange={(e) => setTaskDate(e.target.value)}
          />
        </div>

        <div className="jornada-form__field">
          <label className="jornada-form__label" htmlFor="task-time">
            {t("tasks.fields.timeSpent")}
          </label>
          <input
            id="task-time"
            type="number"
            min="0"
            className="jornada-form__input"
            placeholder={t("tasks.fields.timeSpentPlaceholder")}
            value={timeSpent}
            onChange={(e) => setTimeSpent(e.target.value)}
          />
        </div>
      </div>

      <div className="jornada-form__row">
        <div className="jornada-form__field">
          <label className="jornada-form__label" htmlFor="task-priority">
            {t("tasks.fields.priority")}
          </label>
          <select
            id="task-priority"
            className="jornada-form__select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="high">{t("tasks.priority.high")}</option>
            <option value="medium">{t("tasks.priority.medium")}</option>
            <option value="low">{t("tasks.priority.low")}</option>
          </select>
        </div>

        <div className="jornada-form__field">
          <label className="jornada-form__label" htmlFor="task-status">
            {t("tasks.fields.status")}
          </label>
          <select
            id="task-status"
            className="jornada-form__select"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="pending">{t("tasks.status.pending")}</option>
            <option value="in_progress">{t("tasks.status.in_progress")}</option>
            <option value="completed">{t("tasks.status.completed")}</option>
            <option value="blocked">{t("tasks.status.blocked")}</option>
          </select>
        </div>

        <div className="jornada-form__field">
          <label className="jornada-form__label" htmlFor="task-due">
            {t("tasks.fields.dueDate")}
          </label>
          <input
            id="task-due"
            type="date"
            className="jornada-form__input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="jornada-form__field">
        <label className="jornada-form__label" htmlFor="task-desc">
          {t("tasks.fields.description")}
        </label>
        <textarea
          id="task-desc"
          className="jornada-form__textarea"
          placeholder={t("tasks.fields.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="jornada-form__actions">
        <button type="button" className="jornada-btn jornada-btn--ghost" onClick={onCancel}>
          {tCommon("actions.cancel")}
        </button>
        <button type="submit" className="jornada-btn jornada-btn--primary">
          {t("tasks.form.save")}
        </button>
      </div>
    </form>
  );
}
