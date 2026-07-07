import type { AppointmentDetail } from "../types/appointment";

export interface ProviderStats {
  upcoming: number;
  today: number;
  booked: number;
  services: number;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getUpcomingAppointments(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  const now = Date.now();

  return appointments
    .filter(
      (appointment) =>
        appointment.status === "Booked" &&
        new Date(appointment.startTime).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
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
    booked: appointments.filter((appointment) => appointment.status === "Booked")
      .length,
    services: servicesCount,
  };
}
