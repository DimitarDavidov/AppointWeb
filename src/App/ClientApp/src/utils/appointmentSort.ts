import type { AppointmentDetail } from "../types/appointment";

export function compareAppointmentsByStartDateAsc(
  a: AppointmentDetail,
  b: AppointmentDetail
): number {
  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

export function compareAppointmentsByStartDateDesc(
  a: AppointmentDetail,
  b: AppointmentDetail
): number {
  return compareAppointmentsByStartDateAsc(b, a);
}
