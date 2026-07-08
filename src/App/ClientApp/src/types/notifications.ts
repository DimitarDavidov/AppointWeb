export const NotificationTypes = {
  AppointmentCancelled: "AppointmentCancelled",
  AppointmentConfirmed: "AppointmentConfirmed",
  RescheduleReceived: "RescheduleReceived",
  RescheduleAccepted: "RescheduleAccepted",
} as const;

export type NotificationType =
  (typeof NotificationTypes)[keyof typeof NotificationTypes];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
