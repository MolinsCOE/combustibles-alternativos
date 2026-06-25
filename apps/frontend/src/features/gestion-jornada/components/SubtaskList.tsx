import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check } from "lucide-react";
import type { Subtask, Priority, SubtaskStatus } from "../data/types.js";
import { PriorityBadge } from "./PriorityBadge.js";
import type { CreateSubtaskInput } from "../hooks/useGestionJornada.js";

interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: string;
  onAddSubtask: (taskId: string, input: CreateSubtaskInput) => void;
  onChangeStatus: (taskId: string, subtaskId: string, status: SubtaskStatus) => void;
  readonly?: boolean;
}

interface SubtaskFormData {
  title: string;
  priority: Priority;
  dueDate: string;
}

function SubtaskForm({
  onSave,
  onCancel
}: {
  onSave: (data: SubtaskFormData) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("subtasks.form.errors.titleRequired"));
      return;
    }
    onSave({ title: title.trim(), priority, dueDate });
  }

  return (
    <form className="jornada-subtask-form" onSubmit={handleSubmit} noValidate>
      <div className="jornada-subtask-form__row">
        <input
          type="text"
          className={`jornada-form__input jornada-subtask-form__title${error ? " jornada-form__input--error" : ""}`}
          placeholder={t("subtasks.fields.titlePlaceholder")}
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
          autoFocus
        />
        <select
          className="jornada-form__select jornada-subtask-form__priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label={t("subtasks.fields.priority")}
        >
          <option value="high">{t("tasks.priority.high")}</option>
          <option value="medium">{t("tasks.priority.medium")}</option>
          <option value="low">{t("tasks.priority.low")}</option>
        </select>
        <input
          type="date"
          className="jornada-form__input jornada-subtask-form__date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label={t("subtasks.fields.dueDate")}
        />
      </div>
      {error && <span className="jornada-form__error" role="alert">{error}</span>}
      <div className="jornada-form__actions jornada-form__actions--inline">
        <button type="button" className="jornada-btn jornada-btn--ghost jornada-btn--sm" onClick={onCancel}>
          {tCommon("actions.cancel")}
        </button>
        <button type="submit" className="jornada-btn jornada-btn--primary jornada-btn--sm">
          {t("subtasks.form.save")}
        </button>
      </div>
    </form>
  );
}

export function SubtaskList({
  subtasks,
  taskId,
  onAddSubtask,
  onChangeStatus,
  readonly = false
}: SubtaskListProps) {
  const { t } = useTranslation("gestion-jornada");
  const [adding, setAdding] = useState(false);

  const completed = subtasks.filter((s) => s.status === "completed").length;
  const pct = subtasks.length > 0 ? Math.round((completed / subtasks.length) * 100) : 0;

  function handleSave(data: SubtaskFormData) {
    onAddSubtask(taskId, {
      title: data.title,
      priority: data.priority,
      dueDate: data.dueDate || null
    });
    setAdding(false);
  }

  return (
    <section className="jornada-subtask-list">
      <header className="jornada-subtask-list__header">
        <h4 className="jornada-subtask-list__title">
          {t("subtasks.title")}
          {subtasks.length > 0 && (
            <span className="jornada-subtask-list__progress" style={{ marginLeft: "0.5rem", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              {completed}/{subtasks.length}
            </span>
          )}
        </h4>
        {!readonly && (
          <button
            type="button"
            className="jornada-btn jornada-btn--ghost jornada-btn--sm"
            onClick={() => setAdding(true)}
          >
            <Plus size={13} aria-hidden="true" />
            {t("subtasks.new")}
          </button>
        )}
      </header>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="jornada-subtask-list__bar-wrap" title={`${pct}% completado`}>
          <div className="jornada-subtask-list__bar" style={{ width: `${pct}%` }} />
        </div>
      )}

      {subtasks.length === 0 && !adding && (
        <p className="jornada-empty-hint">{t("subtasks.empty")}</p>
      )}

      <ul className="jornada-subtask-list__items">
        {subtasks.map((s) => {
          const isDone = s.status === "completed";
          return (
            <li key={s.id} className={`jornada-subtask-item${isDone ? " jornada-subtask-item--done" : ""}`}>
              <button
                type="button"
                className="jornada-subtask-item__check"
                onClick={() =>
                  onChangeStatus(taskId, s.id, isDone ? "pending" : "completed")
                }
                aria-label={isDone ? t("subtasks.actions.reopen") : t("subtasks.actions.complete")}
                aria-pressed={isDone}
              >
                {isDone && <Check size={11} aria-hidden="true" />}
              </button>
              <span className="jornada-subtask-item__title">{s.title}</span>
              <PriorityBadge priority={s.priority} />
              {s.dueDate && (
                <span className="jornada-subtask-item__date">
                  {new Date(`${s.dueDate}T12:00:00`).toLocaleDateString("es-ES")}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {adding && (
        <SubtaskForm
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  );
}
