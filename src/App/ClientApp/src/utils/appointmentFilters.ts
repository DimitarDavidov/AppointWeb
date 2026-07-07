import type { AppointmentDetail } from "../types/appointment";
import {
  compareAppointmentsByStartDateAsc,
  compareAppointmentsByStartDateDesc,
} from "./appointmentSort";

export type AppointmentFilter = "upcoming" | "pending" | "cancelled" | "past";

export const APPOINTMENT_FILTERS: {
  id: AppointmentFilter;
  label: string;
}[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "cancelled", label: "Cancelled" },
  { id: "past", label: "Past" },
];

export function filterAppointmentsByStatus(
  appointments: AppointmentDetail[],
  filter: AppointmentFilter
): AppointmentDetail[] {
  const now = Date.now();

  switch (filter) {
    case "upcoming":
      return appointments
        .filter(
          (appointment) =>
            appointment.status === "Booked" &&
            new Date(appointment.endTime).getTime() >= now
        )
        .sort(compareAppointmentsByStartDateAsc);

    case "pending":
      return appointments
        .filter((appointment) => appointment.status === "Pending")
        .sort(compareAppointmentsByStartDateAsc);

    case "cancelled":
      return appointments
        .filter((appointment) => appointment.status === "Cancelled")
        .sort(compareAppointmentsByStartDateDesc);

    case "past":
      return appointments
        .filter(
          (appointment) =>
            appointment.status === "Completed" ||
            appointment.status === "NoShow" ||
            (appointment.status === "Booked" &&
              new Date(appointment.endTime).getTime() < now)
        )
        .sort(compareAppointmentsByStartDateDesc);
  }
}

export function getAppointmentFilterEmptyMessage(filter: AppointmentFilter): string {
  switch (filter) {
    case "upcoming":
      return "No upcoming appointments.";
    case "pending":
      return "No pending appointments.";
    case "cancelled":
      return "No cancelled appointments.";
    case "past":
      return "No past appointments.";
  }
}
