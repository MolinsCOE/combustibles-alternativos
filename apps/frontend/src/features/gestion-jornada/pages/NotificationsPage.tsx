import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, CalendarClock, BellOff } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useGestionJornadaContext } from "../hooks/GestionJornadaContext.js";

export function NotificationsPage() {
  const { t } = useTranslation("gestion-jornada");
  const { notifications, tasks, unreadCount, markNotificationRead, markAllNotificationsRead } =
    useGestionJornadaContext();

  const inAppNotifs = notifications.filter((n) => n.channel === "in_app");
  const hasUnread = inAppNotifs.some((n) => !n.isRead);

  function getTitle(notif: typeof inAppNotifs[number]): string {
    if (notif.taskTitle) {
      return t("notifications.dueDate.task", { title: notif.taskTitle });
    }
    if (notif.subtaskTitle) {
      return t("notifications.dueDate.subtask", { title: notif.subtaskTitle });
    }
    const task = tasks.find((tk) => tk.id === notif.taskId);
    if (task) return t("notifications.dueDate.task", { title: task.title });
    return "Recordatorio de fecha límite";
  }

  return (
    <div className="jornada-page">
      <DemoBanner />

      {/* Header */}
      <div className="jornada-header">
        <div className="jornada-header__left">
          <Bell size={18} aria-hidden="true" style={{ color: "#116c65" }} />
          <h1 className="jornada-page-title">
            {t("notifications.title")}
            {unreadCount > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  background: "#d3322f",
                  color: "#ffffff",
                  borderRadius: "999px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "0.1rem 0.45rem",
                  verticalAlign: "middle"
                }}
                aria-label={`${unreadCount} no leídas`}
              >
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {hasUnread && (
          <div className="jornada-header__right">
            <button
              type="button"
              className="jornada-btn jornada-btn--ghost jornada-btn--sm"
              onClick={markAllNotificationsRead}
            >
              <CheckCheck size={14} aria-hidden="true" />
              {t("notifications.markAllRead")}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="jornada-content">
        {inAppNotifs.length === 0 ? (
          <div className="jornada-empty">
            <BellOff size={40} className="jornada-empty__icon" aria-hidden="true" />
            <p>{t("notifications.empty")}</p>
          </div>
        ) : (
          <ul className="jornada-notification-list" aria-label={t("notifications.title")}>
            {inAppNotifs.map((notif) => (
              <li
                key={notif.id}
                className={`jornada-notification-item${notif.isRead ? " jornada-notification-item--read" : ""}`}
              >
                <span className="jornada-notification-item__dot" aria-hidden="true" />
                <span className="jornada-notification-item__icon" aria-hidden="true">
                  <CalendarClock size={16} />
                </span>
                <div className="jornada-notification-item__body">
                  <p className="jornada-notification-item__text">{getTitle(notif)}</p>
                  <time className="jornada-notification-item__time" dateTime={notif.sentAt}>
                    {new Date(notif.sentAt).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </time>
                </div>
                {!notif.isRead && (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--ghost jornada-btn--sm"
                    onClick={() => markNotificationRead(notif.id)}
                    aria-label={t("notifications.markRead")}
                    title={t("notifications.markRead")}
                  >
                    <CheckCheck size={13} aria-hidden="true" />
                    {t("notifications.markRead")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
