import api from "./api";
import type {
  Appointment,
  CreateAppointmentRequest,
} from "../types/appointment";

export async function createAppointment(
  data: CreateAppointmentRequest
): Promise<Appointment> {
  const response = await api.post<Appointment>("/api/appointments", data);
  return response.data;
}
