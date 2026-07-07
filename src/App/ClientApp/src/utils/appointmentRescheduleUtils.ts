import type { AppointmentDetail } from "../types/appointment";
import { isSameId } from "./isSameId";
import { formatAppointmentDateTime } from "./formatAppointment";

export function getReschedulePartyCountLabel(count: number): string {
  if (count === 0) {
    return "Not rescheduled";
  }

  return count === 1 ? "1 time" : `${count} times`;
}

export function getPreviousRescheduleTimeLabel(
  previousStartTime: string | null
): string {
  if (!previousStartTime) {
    return "No previous reschedule";
  }

  return formatAppointmentDateTime(previousStartTime);
}

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
