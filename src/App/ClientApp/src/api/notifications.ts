import api from "./api";
import type { Notification, UnreadCountResponse } from "../types/notifications";

export async function getNotifications(): Promise<Notification[]> {
  const response = await api.get<Notification[]>("/api/notifications");
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>(
    "/api/notifications/unread-count"
  );
  return response.data.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/api/notifications/read-all");
}
