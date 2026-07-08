import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notifications";
import type { Notification } from "../types/notifications";

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const [items, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      if (!isMountedRef.current) return;

      setNotifications(items);
      setUnreadCount(count);
    } catch {
      // Keep existing state on poll failures.
    }
  }, [enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadInitial() {
      setIsLoading(true);
      try {
        const [items, count] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);

        if (cancelled) return;

        setNotifications(items);
        setUnreadCount(count);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}
