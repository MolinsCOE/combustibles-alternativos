import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, FolderKanban, FolderOpen, FolderX, Edit2, ArrowRight, CalendarDays, CheckSquare2 } from "lucide-react";
import { Link } from "react-router-dom";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useGestionJornadaContext } from "../hooks/GestionJornadaContext.js";
import { ProjectForm } from "../components/ProjectForm.js";
import { ProjectStatusBadge } from "../components/StatusBadge.js";
import type { Project } from "../data/types.js";
import type { CreateProjectInput, UpdateProjectInput } from "../hooks/useGestionJornada.js";

type Modal =
  | { type: "create" }
  | { type: "edit"; project: Project }
  | { type: "confirmClose"; project: Project }
  | null;

export function ProjectsPage() {
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");
  const {
    projects,
    tasks,
    createProject,
    updateProject,
    closeProject,
    reopenProject
  } = useGestionJornadaContext();

  const [modal, setModal] = useState<Modal>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const filtered = projects.filter((p) => {
    if (filter === "open") return p.status === "open";
    if (filter === "closed") return p.status === "closed";
    return true;
  });

  function getTaskCount(projectId: string): number {
    return tasks.filter((t) => t.projectId === projectId).length;
  }

  function getCompletedTaskCount(projectId: string): number {
    return tasks.filter((t) => t.projectId === projectId && t.status === "completed").length;
  }

  function handleSave(data: CreateProjectInput | UpdateProjectInput) {
    if (modal?.type === "create") {
      createProject(data as CreateProjectInput);
    } else if (modal?.type === "edit") {
      updateProject(modal.project.id, data as UpdateProjectInput);
    }
    setModal(null);
  }

  function handleClose(id: string) {
    const project = projects.find((p) => p.id === id);
    if (project) setModal({ type: "confirmClose", project });
  }

  function confirmClose() {
    if (modal?.type === "confirmClose") {
      closeProject(modal.project.id);
      setModal(null);
    }
  }

  return (
    <div className="jornada-page">
      <DemoBanner />

      {/* Header */}
      <div className="jornada-header">
        <div className="jornada-header__left">
          <FolderKanban size={18} aria-hidden="true" style={{ color: "#116c65" }} />
          <h1 className="jornada-page-title">{t("projects.title")}</h1>
        </div>
        <div className="jornada-header__right">
          <button
            type="button"
            className="jornada-btn jornada-btn--primary"
            onClick={() => setModal({ type: "create" })}
          >
            <Plus size={15} aria-hidden="true" />
            {t("projects.new")}
          </button>
        </div>
      </div>

      {/* Toolbar / Filtros */}
      <div className="jornada-toolbar">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`jornada-filter-btn${filter === f ? " jornada-filter-btn--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todos" : t(`projects.status.${f}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="jornada-content">
        {filtered.length === 0 ? (
          <div className="jornada-empty">
            <FolderOpen size={40} className="jornada-empty__icon" aria-hidden="true" />
            <p>{t("projects.empty")}</p>
            <p className="jornada-empty__hint">{t("projects.emptyHint")}</p>
          </div>
        ) : (
          <div className="jornada-project-grid">
            {filtered.map((project) => {
              const total = getTaskCount(project.id);
              const done = getCompletedTaskCount(project.id);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isOpen = project.status === "open";

              return (
                <article
                  key={project.id}
                  className={`jornada-project-card${isOpen ? "" : " jornada-project-card--closed"}`}
                >
                  <header className="jornada-project-card__header">
                    <div className="jornada-project-card__title-row">
                      <h3 className="jornada-project-card__name">{project.name}</h3>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="jornada-project-card__desc">{project.description}</p>
                    )}
                  </header>

                  <div className="jornada-project-card__meta">
                    <span className="jornada-project-card__meta-item">
                      <CheckSquare2 size={12} aria-hidden="true" />
                      {done}/{total} {t("projects.detail.tasks").toLowerCase()}
                    </span>
                    <span className="jornada-project-card__meta-item">
                      <CalendarDays size={12} aria-hidden="true" />
                      {new Date(project.openedAt).toLocaleDateString("es-ES")}
                    </span>
                    {project.closedAt && (
                      <span className="jornada-project-card__meta-item">
                        → {new Date(project.closedAt).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {total > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#616666" }}>
                        <span>Progreso</span>
                        <span style={{ fontWeight: 600, color: pct === 100 ? "#00b847" : "#2c3030" }}>{pct}%</span>
                      </div>
                      <div style={{ height: "4px", background: "#f1f3f5", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: pct === 100 ? "#00b847" : "#116c65",
                            borderRadius: "2px",
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <footer className="jornada-project-card__actions">
                    <button
                      type="button"
                      className="jornada-btn jornada-btn--ghost jornada-btn--sm"
                      onClick={() => setModal({ type: "edit", project })}
                      aria-label={`${t("projects.actions.edit")}: ${project.name}`}
                    >
                      <Edit2 size={13} aria-hidden="true" />
                      {tCommon("actions.edit")}
                    </button>

                    <button
                      type="button"
                      className={`jornada-btn jornada-btn--sm ${isOpen ? "jornada-btn--danger-ghost" : "jornada-btn--ghost"}`}
                      onClick={() => isOpen ? handleClose(project.id) : reopenProject(project.id)}
                      aria-label={isOpen ? t("projects.actions.close") : t("projects.actions.reopen")}
                    >
                      {isOpen ? (
                        <FolderX size={13} aria-hidden="true" />
                      ) : (
                        <FolderOpen size={13} aria-hidden="true" />
                      )}
                      {isOpen ? t("projects.actions.close") : t("projects.actions.reopen")}
                    </button>

                    <Link
                      to={`/jornada/proyectos/${project.id}`}
                      className="jornada-btn jornada-btn--primary jornada-btn--sm"
                      aria-label={`${t("projects.actions.viewTasks")}: ${project.name}`}
                      style={{ marginLeft: "auto" }}
                    >
                      <ArrowRight size={13} aria-hidden="true" />
                      {t("projects.actions.viewTasks")}
                    </Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <div className="jornada-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-project-title">
          <div className="jornada-modal">
            <div className="jornada-modal__header">
              <h2 className="jornada-modal__title" id="modal-project-title">
                {modal.type === "create" ? t("projects.form.createTitle") : t("projects.form.editTitle")}
              </h2>
              <button
                type="button"
                className="jornada-btn--icon-ghost"
                onClick={() => setModal(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <ProjectForm
              initial={modal.type === "edit" ? modal.project : undefined}
              onSave={handleSave}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}

      {/* Modal confirmar cierre */}
      {modal?.type === "confirmClose" && (
        <div className="jornada-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-close-title">
          <div className="jornada-modal jornada-modal--sm">
            <div className="jornada-modal__header">
              <h2 className="jornada-modal__title" id="modal-close-title">{t("projects.actions.close")}</h2>
            </div>
            <p className="jornada-modal__body">
              {t("projects.actions.closeConfirm", { name: modal.project.name })}
            </p>
            <div className="jornada-form__actions">
              <button
                type="button"
                className="jornada-btn jornada-btn--ghost"
                onClick={() => setModal(null)}
              >
                {tCommon("actions.cancel")}
              </button>
              <button
                type="button"
                className="jornada-btn jornada-btn--danger"
                onClick={confirmClose}
              >
                {t("projects.actions.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
