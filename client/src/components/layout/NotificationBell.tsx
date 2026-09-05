import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  getNotifications,
  markNotificationAsRead,
  type NotificationRecord,
} from "../../services/notificationService";

function timeAgo(dateString?: string) {
  if (!dateString) return "";

  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationLink(notification: NotificationRecord): string | null {
  if (notification.orderId) {
    return `/orders/${notification.orderId}`;
  }

  return null;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    void loadNotifications();

    const interval = setInterval(() => void loadNotifications(), 60_000);
    return () => clearInterval(interval);
  }, []);

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

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await getNotifications(15);
      setNotifications(Array.isArray(result) ? result : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notification: NotificationRecord) {
    if (notification.isRead) return;

    setNotifications((current) =>
      current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item,
      ),
    );

    await markNotificationAsRead(notification._id);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-blue-600">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                Loading...
              </p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                No notifications yet.
              </p>
            )}

            {notifications.map((notification) => {
              const link = notificationLink(notification);

              const content = (
                <div
                  className={[
                    "flex gap-2 px-4 py-3 text-left transition hover:bg-gray-50",
                    !notification.isRead ? "bg-blue-50/60" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      notification.isRead ? "bg-transparent" : "bg-blue-600",
                    ].join(" ")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return link ? (
                <Link
                  key={notification._id}
                  to={link}
                  onClick={() => {
                    void handleMarkAsRead(notification);
                    setOpen(false);
                  }}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => void handleMarkAsRead(notification)}
                  className="block w-full"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
