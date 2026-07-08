import api from "./api";
import type { AppointmentDetail } from "../types/appointment";
import type {
  CreateProviderServiceRequest,
  ProviderAvailabilitySlot,
  ProviderAvailabilitySlotInput,
  ProviderServiceDetail,
  UpdateProviderServiceRequest,
} from "../types/provider";

export async function getProviderAppointments(): Promise<AppointmentDetail[]> {
  const response = await api.get<AppointmentDetail[]>("/api/provider/appointments");
  return response.data;
}

export async function getProviderServices(): Promise<ProviderServiceDetail[]> {
  const response = await api.get<ProviderServiceDetail[]>("/api/provider/services");
  return response.data;
}

export async function createProviderService(
  data: CreateProviderServiceRequest
): Promise<ProviderServiceDetail> {
  const response = await api.post<ProviderServiceDetail>("/api/provider/services", data);
  return response.data;
}

export async function updateProviderService(
  serviceId: string,
  data: UpdateProviderServiceRequest
): Promise<ProviderServiceDetail> {
  const response = await api.patch<ProviderServiceDetail>(
    `/api/provider/services/${serviceId}`,
    data
  );
  return response.data;
}

export async function getProviderServiceAvailability(
  serviceId: string
): Promise<ProviderAvailabilitySlot[]> {
  const response = await api.get<ProviderAvailabilitySlot[]>(
    `/api/provider/services/${serviceId}/availability`
  );
  return response.data;
}

export async function updateProviderServiceAvailability(
  serviceId: string,
  slots: ProviderAvailabilitySlotInput[]
): Promise<ProviderAvailabilitySlot[]> {
  const response = await api.put<ProviderAvailabilitySlot[]>(
    `/api/provider/services/${serviceId}/availability`,
    { slots }
  );
  return response.data;
}
