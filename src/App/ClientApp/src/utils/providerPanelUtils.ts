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

export interface ProviderServiceStats {
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  revenueEarned: number;
}

export function computeProviderServiceStats(
  appointments: AppointmentDetail[]
): Record<string, ProviderServiceStats> {
  const stats: Record<string, ProviderServiceStats> = {};

  for (const appointment of appointments) {
    const existing = stats[appointment.serviceId] ?? {
      completedCount: 0,
      cancelledCount: 0,
      noShowCount: 0,
      revenueEarned: 0,
    };

    if (appointment.status === "Completed") {
      existing.completedCount += 1;
      existing.revenueEarned += appointment.priceAtBooking;
    } else if (appointment.status === "Cancelled") {
      existing.cancelledCount += 1;
    } else if (appointment.status === "NoShow") {
      existing.noShowCount += 1;
    }

    stats[appointment.serviceId] = existing;
  }

  return stats;
}

export function getProviderServiceStats(
  statsByServiceId: Record<string, ProviderServiceStats>,
  serviceId: string
): ProviderServiceStats {
  return (
    statsByServiceId[serviceId] ?? {
      completedCount: 0,
      cancelledCount: 0,
      noShowCount: 0,
      revenueEarned: 0,
    }
  );
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function filterUpcomingAppointmentsForToday(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  const now = new Date();

  return appointments.filter((appointment) =>
    isSameLocalDay(new Date(appointment.startTime), now)
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

export function getPendingAppointments(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  return appointments
    .filter((appointment) => appointment.status === "Pending")
    .sort(compareAppointmentsByStartDateAsc);
}

export function getUpcomingAppointments(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  const now = Date.now();

  return appointments
    .filter(
      (appointment) =>
        appointment.status === "Booked" &&
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
  const pending = getPendingAppointments(appointments);

  return {
    upcoming: upcoming.length,
    today: upcoming.filter((appointment) =>
      isSameLocalDay(new Date(appointment.startTime), now)
    ).length,
    pending: pending.length,
    services: servicesCount,
  };
}
