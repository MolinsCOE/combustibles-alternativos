import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { t } = useTranslation("about");
  const version = __APP_VERSION__;
  const appName = t("appName");

  return (
    <section className="about">
      <header className="about__hero">
        <h1 className="about__title">{t("title")}</h1>
      </header>

      <article className="about__card">
        <h2 className="about__section-title">{t("identity.title")}</h2>
        <dl className="about__identity">
          <dt>{t("identity.versionLabel")}</dt>
          <dd>{t("identity.format", { appName, version })}</dd>
        </dl>
      </article>

      <article className="about__card">
        <h2 className="about__section-title">{t("purpose.title")}</h2>
        <p className="about__purpose">{t("purpose.body")}</p>
      </article>
    </section>
  );
}
