import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "../data/types.js";
import type { CreateProjectInput, UpdateProjectInput } from "../hooks/useGestionJornada.js";

interface ProjectFormProps {
  initial?: Project;
  onSave: (data: CreateProjectInput | UpdateProjectInput) => void;
  onCancel: () => void;
}

export function ProjectForm({ initial, onSave, onCancel }: ProjectFormProps) {
  const { t } = useTranslation("gestion-jornada");
  const { t: tCommon } = useTranslation("common");

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs["name"] = t("projects.form.errors.nameRequired");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null
    });
  }

  return (
    <form className="jornada-form" onSubmit={handleSubmit} noValidate>
      <div className="jornada-form__field">
        <label className="jornada-form__label" htmlFor="project-name">
          {t("projects.fields.name")} <span aria-hidden="true">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          className={`jornada-form__input${errors["name"] ? " jornada-form__input--error" : ""}`}
          placeholder={t("projects.fields.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {errors["name"] && (
          <span className="jornada-form__error" role="alert">
            {errors["name"]}
          </span>
        )}
      </div>

      <div className="jornada-form__field">
        <label className="jornada-form__label" htmlFor="project-description">
          {t("projects.fields.description")}
        </label>
        <textarea
          id="project-description"
          className="jornada-form__textarea"
          placeholder={t("projects.fields.descriptionPlaceholder")}
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
          {t("projects.form.save")}
        </button>
      </div>
    </form>
  );
}
