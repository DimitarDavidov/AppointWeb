import api from "./api";
import type {
  Appointment,
  AppointmentDetail,
  CreateAppointmentRequest,
} from "../types/appointment";

export async function getAppointments(): Promise<AppointmentDetail[]> {
  const response = await api.get<AppointmentDetail[]>("/api/appointments");
  return response.data;
}

export async function createAppointment(
  data: CreateAppointmentRequest
): Promise<Appointment> {
  const response = await api.post<Appointment>("/api/appointments", data);
  return response.data;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const response = await api.patch<Appointment>(`/api/appointments/${id}/cancel`);
  return response.data;
}

export interface RescheduleAppointmentRequest {
  startTime: string;
}

export async function rescheduleAppointment(
  id: string,
  data: RescheduleAppointmentRequest
): Promise<Appointment> {
  const response = await api.patch<Appointment>(
    `/api/appointments/${id}/reschedule`,
    data
  );
  return response.data;
}
