import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { UserRoles } from "../../constants/roles";
import type { Notification } from "../../types/notifications";
import { BellIcon } from "../Navbar/NavIcons";
import "./NotificationBell.scss";

function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getNotificationDestination(role: string | null): string {
  return role === UserRoles.Provider || role === UserRoles.Admin
    ? "/provider"
    : "/appointments";
}

interface NotificationBellProps {
  isLoggedIn: boolean;
  role: string | null;
}

function NotificationBell({ isLoggedIn, role }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(isLoggedIn);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isLoggedIn) return null;

  async function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    setOpen(false);
    navigate(getNotificationDestination(role));
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    await markAllAsRead();
  }

  return (
    <div
      ref={containerRef}
      className={`notification-bell${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="notification-bell-trigger"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div className="notification-bell-panel">
        <div className="notification-bell-header">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-bell-mark-all"
              onClick={() => void handleMarkAllAsRead()}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notification-bell-list">
          {isLoading && notifications.length === 0 ? (
            <p className="notification-bell-empty">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <p className="notification-bell-empty">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`notification-bell-item${
                  notification.isRead ? "" : " notification-bell-item--unread"
                }`}
                onClick={() => void handleNotificationClick(notification)}
              >
                <span className="notification-bell-item-title">
                  {notification.title}
                </span>
                <span className="notification-bell-item-message">
                  {notification.message}
                </span>
                <span className="notification-bell-item-time">
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationBell;
