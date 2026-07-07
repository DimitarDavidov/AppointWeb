import type { AppointmentDetail } from "../types/appointment";
import { isSameId } from "./isSameId";

export function hasPendingReschedule(
  appointment: AppointmentDetail
): appointment is AppointmentDetail & {
  pendingRescheduleStartTime: string;
  pendingRescheduleEndTime: string;
  rescheduleRequestedByUserId: string;
} {
  return (
    appointment.pendingRescheduleStartTime != null &&
    appointment.pendingRescheduleEndTime != null &&
    appointment.rescheduleRequestedByUserId != null
  );
}

export function canAcceptReschedule(
  appointment: AppointmentDetail,
  userId: string | null
): boolean {
  return (
    hasPendingReschedule(appointment) &&
    userId != null &&
    !isSameId(userId, appointment.rescheduleRequestedByUserId)
  );
}

export function isRescheduleAwaitingResponse(
  appointment: AppointmentDetail,
  userId: string | null
): boolean {
  return (
    hasPendingReschedule(appointment) &&
    userId != null &&
    isSameId(userId, appointment.rescheduleRequestedByUserId)
  );
}
