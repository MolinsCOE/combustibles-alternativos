import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useGestionJornadaContext } from "../hooks/GestionJornadaContext.js";
import { TaskForm } from "../components/TaskForm.js";
import { PriorityBadge } from "../components/PriorityBadge.js";
import { TaskStatusBadge } from "../components/StatusBadge.js";
import type { Task } from "../data/types.js";
import type { CreateTaskInput } from "../hooks/useGestionJornada.js";

/* ---- helpers ---- */
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0 (Mon) ... 6 (Sun) — ISO week start Monday */
function dayOfWeekMon(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });
}

function formatDayHeader(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function formatTime(minutes: number): string {
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }
  return `${minutes}min`;
}

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

/* ---- component ---- */
type Modal = { type: "create" } | null;

export function DailyPage() {
  const { t } = useTranslation("gestion-jornada");
  const today = todayIso();
  const now = new Date();

  const { projects, tasks, createTask } = useGestionJornadaContext();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [modal, setModal] = useState<Modal>(null);

  /* Calendar grid */
  const firstDay = startOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  const startOffset = dayOfWeekMon(firstDay); // 0=Mon ... 6=Sun

  const cells: Array<{ iso: string | null; day: number | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, day: d });
  }

  /* Tasks by date */
  function tasksForDate(iso: string): Task[] {
    return tasks.filter((t) => t.taskDate === iso);
  }

  /* Selected day tasks */
  const dayTasks = tasksForDate(selectedDate);
  const totalMinutes = dayTasks.reduce((s, t) => s + (t.timeSpentMinutes ?? 0), 0);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function handleSave(data: CreateTaskInput) {
    createTask({ ...data, taskDate: selectedDate });
    setModal(null);
  }

  return (
    <div className="jornada-page">
      <DemoBanner />

      {/* Header */}
      <div className="jornada-header">
        <div className="jornada-header__left">
          <Calendar size={18} aria-hidden="true" style={{ color: "#116c65" }} />
          <h1 className="jornada-page-title">{t("nav.today")}</h1>
        </div>
        <div className="jornada-header__right">
          <button
            type="button"
            className="jornada-btn jornada-btn--primary"
            onClick={() => setModal({ type: "create" })}
          >
            <Plus size={15} aria-hidden="true" />
            {t("tasks.new")}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="jornada-content">
        <div className="jornada-daily-layout">
          {/* Calendar */}
          <div className="jornada-daily-layout__calendar">
            <div className="jornada-calendar">
              {/* Nav */}
              <div className="jornada-calendar__nav">
                <button
                  type="button"
                  className="jornada-btn--icon-ghost"
                  onClick={prevMonth}
                  aria-label={t("daily.navigate.prev")}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <h2 className="jornada-calendar__month" style={{ textTransform: "capitalize" }}>
                  {formatMonth(year, month)}
                </h2>
                <button
                  type="button"
                  className="jornada-btn--icon-ghost"
                  onClick={nextMonth}
                  aria-label={t("daily.navigate.next")}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="jornada-calendar__weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="jornada-calendar__weekday">{label}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="jornada-calendar__grid">
                {cells.map((cell, idx) => {
                  if (!cell.iso) {
                    return <div key={`empty-${idx}`} className="jornada-calendar__day jornada-calendar__day--empty"><span className="jornada-calendar__day-num" /></div>;
                  }
                  const isToday = cell.iso === today;
                  const isSelected = cell.iso === selectedDate;
                  const dayTaskList = tasksForDate(cell.iso);
                  const visible = dayTaskList.slice(0, 2);
                  const overflow = dayTaskList.length - visible.length;

                  return (
                    <div
                      key={cell.iso}
                      className={[
                        "jornada-calendar__day",
                        isToday ? "jornada-calendar__day--today" : "",
                        isSelected ? "jornada-calendar__day--selected" : ""
                      ].join(" ")}
                      onClick={() => setSelectedDate(cell.iso!)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedDate(cell.iso!); }}
                      aria-label={`${cell.day} — ${dayTaskList.length} tareas`}
                      aria-pressed={isSelected}
                    >
                      <span className="jornada-calendar__day-num">{cell.day}</span>
                      <div className="jornada-calendar__chips">
                        {visible.map((tk) => (
                          <span key={tk.id} className={`jornada-calendar__chip jornada-calendar__chip--${tk.status}`}>
                            {tk.title}
                          </span>
                        ))}
                        {overflow > 0 && (
                          <span className="jornada-calendar__more">+{overflow} más</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day panel */}
          <div className="jornada-daily-layout__panel">
            <div className="jornada-day-panel__header">
              <h3 className="jornada-day-panel__date" style={{ textTransform: "capitalize" }}>
                {formatDayHeader(selectedDate)}
                {selectedDate === today && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "#116c65", color: "#fff", borderRadius: "999px", padding: "0.1rem 0.45rem" }}>
                    {t("nav.today")}
                  </span>
                )}
              </h3>
              {totalMinutes > 0 && (
                <span className="jornada-day-panel__summary">
                  <Clock size={12} aria-hidden="true" />
                  {formatTime(totalMinutes)}
                </span>
              )}
            </div>

            <div className="jornada-day-panel__body">
              {dayTasks.length === 0 ? (
                <div className="jornada-empty" style={{ padding: "1.5rem 0" }}>
                  <p style={{ fontSize: "0.875rem" }}>{t("tasks.empty")}</p>
                  <p className="jornada-empty__hint">{t("tasks.emptyHint")}</p>
                </div>
              ) : (
                dayTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <Link
                      key={task.id}
                      to={`/jornada/tareas/${task.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div className={`jornada-task-row${task.status === "completed" ? " jornada-task-row--done" : ""}`}>
                        <span className={`jornada-task-row__priority-dot jornada-task-row__priority-dot--${task.priority}`} aria-hidden="true" />
                        <div className="jornada-task-row__content">
                          <p className="jornada-task-row__title">{task.title}</p>
                          <div className="jornada-task-row__sub">
                            {project && <span style={{ color: "#116c65", fontWeight: 500 }}>{project.name}</span>}
                          </div>
                        </div>
                        <div className="jornada-task-row__meta">
                          <TaskStatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal crear tarea */}
      {modal?.type === "create" && (
        <div className="jornada-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-create-task-title">
          <div className="jornada-modal jornada-modal--lg">
            <div className="jornada-modal__header">
              <h2 className="jornada-modal__title" id="modal-create-task-title">{t("tasks.form.createTitle")}</h2>
              <button
                type="button"
                className="jornada-btn--icon-ghost"
                onClick={() => setModal(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <TaskForm
              projects={projects}
              defaultDate={selectedDate}
              onSave={(data) => handleSave(data as CreateTaskInput)}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
