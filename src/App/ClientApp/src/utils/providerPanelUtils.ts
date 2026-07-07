import type { AppointmentDetail } from "../types/appointment";
import { needsAppointmentOutcome } from "./appointmentOutcomeUtils";
import {
  compareAppointmentsByStartDateAsc,
  compareAppointmentsByStartDateDesc,
} from "./appointmentSort";

export interface ProviderStats {
  upcoming: number;
  today: number;
  pending: number;
  services: number;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isActiveAppointmentStatus(status: string): boolean {
  return status === "Booked" || status === "Pending";
}

export function getPastAppointments(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  return appointments
    .filter(
      (appointment) =>
        needsAppointmentOutcome(appointment) ||
        appointment.status === "Completed" ||
        appointment.status === "NoShow"
    )
    .sort(compareAppointmentsByStartDateDesc);
}

export function getCancelledAppointments(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  return appointments
    .filter((appointment) => appointment.status === "Cancelled")
    .sort(compareAppointmentsByStartDateDesc);
}

export function getUpcomingAppointments(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  const now = Date.now();

  return appointments
    .filter(
      (appointment) =>
        isActiveAppointmentStatus(appointment.status) &&
        new Date(appointment.endTime).getTime() >= now
    )
    .sort(compareAppointmentsByStartDateAsc);
}

export {
  getAppointmentsNeedingOutcome,
  needsAppointmentOutcome,
} from "./appointmentOutcomeUtils";

export function getAppointmentTimingLabel(iso: string): string | null {
  const start = new Date(iso);
  const now = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (startDay.getTime() - today.getTime()) / 86_400_000
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  return null;
}

export function formatAppointmentDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatAppointmentTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function computeProviderStats(
  appointments: AppointmentDetail[],
  servicesCount: number
): ProviderStats {
  const now = new Date();
  const upcoming = getUpcomingAppointments(appointments);

  return {
    upcoming: upcoming.length,
    today: upcoming.filter((appointment) =>
      isSameLocalDay(new Date(appointment.startTime), now)
    ).length,
    pending: appointments.filter((appointment) => appointment.status === "Pending")
      .length,
    services: servicesCount,
  };
}
