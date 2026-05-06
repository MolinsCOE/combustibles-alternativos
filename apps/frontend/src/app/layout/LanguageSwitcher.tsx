import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { supportedLanguages, type SupportedLanguage } from "../../shared/i18n/index.js";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("common");
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "es").slice(0, 2) as SupportedLanguage;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as SupportedLanguage;
    void i18n.changeLanguage(next);
  };

  return (
    <label className="language-switcher" aria-label={t("language.switcherAria")}>
      <Globe size={20} aria-hidden="true" />
      <select
        className="language-switcher__select"
        value={current}
        onChange={handleChange}
      >
        {supportedLanguages.map((lng) => (
          <option key={lng} value={lng}>
            {t(`language.codes.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
