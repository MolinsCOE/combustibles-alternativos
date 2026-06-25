import { useTranslation } from "react-i18next";
import { FolderOpen, FolderX, Edit2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project } from "../data/types.js";
import { ProjectStatusBadge } from "./StatusBadge.js";

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
  onEdit: (project: Project) => void;
}

export function ProjectCard({
  project,
  taskCount,
  onClose,
  onReopen,
  onEdit
}: ProjectCardProps) {
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");

  const isOpen = project.status === "open";

  function handleToggle() {
    if (isOpen) {
      onClose(project.id);
    } else {
      onReopen(project.id);
    }
  }

  return (
    <article className={`jornada-project-card${isOpen ? "" : " jornada-project-card--closed"}`}>
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
        <span className="jornada-project-card__task-count">
          {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
        </span>
        <span className="jornada-project-card__date">
          {t("projects.fields.openedAt")}:{" "}
          {new Date(project.openedAt).toLocaleDateString("es-ES")}
        </span>
        {project.closedAt && (
          <span className="jornada-project-card__date">
            {t("projects.fields.closedAt")}:{" "}
            {new Date(project.closedAt).toLocaleDateString("es-ES")}
          </span>
        )}
      </div>

      <footer className="jornada-project-card__actions">
        <button
          type="button"
          className="jornada-btn jornada-btn--ghost jornada-btn--sm"
          onClick={() => onEdit(project)}
          aria-label={`${t("projects.actions.edit")}: ${project.name}`}
        >
          <Edit2 size={16} aria-hidden="true" />
          {tCommon("actions.edit")}
        </button>

        <button
          type="button"
          className={`jornada-btn jornada-btn--sm ${isOpen ? "jornada-btn--danger-ghost" : "jornada-btn--ghost"}`}
          onClick={handleToggle}
          aria-label={isOpen ? t("projects.actions.close") : t("projects.actions.reopen")}
        >
          {isOpen ? (
            <FolderX size={16} aria-hidden="true" />
          ) : (
            <FolderOpen size={16} aria-hidden="true" />
          )}
          {isOpen ? t("projects.actions.close") : t("projects.actions.reopen")}
        </button>

        <Link
          to={`/jornada/proyectos/${project.id}`}
          className="jornada-btn jornada-btn--primary jornada-btn--sm"
          aria-label={`${t("projects.actions.viewTasks")}: ${project.name}`}
        >
          <ArrowRight size={16} aria-hidden="true" />
          {t("projects.actions.viewTasks")}
        </Link>
      </footer>
    </article>
  );
}
