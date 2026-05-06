import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { KeyRound, Users } from "lucide-react";
import { HealthStatus } from "../../health/components/HealthStatus.js";
import { rolesService } from "../../roles/services/roles.service.js";
import { usersService } from "../../users/services/users.service.js";

type CountState =
  | { kind: "loading" }
  | { kind: "ready"; value: number }
  | { kind: "error" };

function useTotalCount(
  fetcher: (signal: AbortSignal) => Promise<number>
): CountState {
  const [state, setState] = useState<CountState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal)
      .then((value) => {
        setState({ kind: "ready", value });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        setState({ kind: "error" });
      });
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

function KpiCard({
  icon,
  label,
  state,
  loadingText,
  errorText
}: {
  icon: ReactNode;
  label: string;
  state: CountState;
  loadingText: string;
  errorText: string;
}) {
  const value =
    state.kind === "ready"
      ? state.value.toLocaleString()
      : state.kind === "loading"
        ? loadingText
        : errorText;
  const isError = state.kind === "error";
  return (
    <article className="home__kpi">
      <div className="home__kpi-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="home__kpi-body">
        <span className="home__kpi-label">{label}</span>
        <span
          className={
            isError
              ? "home__kpi-value home__kpi-value--error"
              : "home__kpi-value"
          }
        >
          {value}
        </span>
      </div>
    </article>
  );
}

export function HomePage() {
  const { t } = useTranslation("home");

  const users = useTotalCount((signal) =>
    usersService.list({ page: 1, pageSize: 1 }, { signal }).then((r) => r.total)
  );
  const roles = useTotalCount((signal) =>
    rolesService.list({ page: 1, pageSize: 1 }, { signal }).then((r) => r.total)
  );

  return (
    <section className="home">
      <header className="home__hero">
        <h1 className="home__title">{t("welcomeTitle")}</h1>
        <p className="home__subtitle">{t("welcomeSubtitle")}</p>
      </header>

      <div className="home__kpis">
        <KpiCard
          icon={<Users size={24} />}
          label={t("kpis.users.label")}
          state={users}
          loadingText={t("kpis.loading")}
          errorText={t("kpis.error")}
        />
        <KpiCard
          icon={<KeyRound size={24} />}
          label={t("kpis.roles.label")}
          state={roles}
          loadingText={t("kpis.loading")}
          errorText={t("kpis.error")}
        />
      </div>

      <article className="home__health">
        <h2 className="home__section-title">{t("health.title")}</h2>
        <div className="home__health-body">
          <HealthStatus />
        </div>
      </article>

      <div className="home__quick">
        <Link to="/administracion/usuarios" className="home__quick-card">
          <div className="home__quick-icon" aria-hidden="true">
            <Users size={24} />
          </div>
          <div className="home__quick-body">
            <h3 className="home__quick-title">{t("quick.users.title")}</h3>
            <p className="home__quick-desc">{t("quick.users.description")}</p>
            <span className="home__quick-action">
              {t("quick.users.action")}
            </span>
          </div>
        </Link>
        <Link to="/administracion/roles" className="home__quick-card">
          <div className="home__quick-icon" aria-hidden="true">
            <KeyRound size={24} />
          </div>
          <div className="home__quick-body">
            <h3 className="home__quick-title">{t("quick.roles.title")}</h3>
            <p className="home__quick-desc">{t("quick.roles.description")}</p>
            <span className="home__quick-action">
              {t("quick.roles.action")}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
