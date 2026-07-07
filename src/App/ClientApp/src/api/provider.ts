import api from "./api";
import type {
  ProviderAvailabilitySlot,
  ProviderAvailabilitySlotInput,
  ProviderServiceDetail,
  UpdateProviderServiceRequest,
} from "../types/provider";

export async function getProviderServices(): Promise<ProviderServiceDetail[]> {
  const response = await api.get<ProviderServiceDetail[]>("/api/provider/services");
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

export async function getProviderAvailability(): Promise<ProviderAvailabilitySlot[]> {
  const response = await api.get<ProviderAvailabilitySlot[]>(
    "/api/provider/availability"
  );
  return response.data;
}

export async function updateProviderAvailability(
  slots: ProviderAvailabilitySlotInput[]
): Promise<ProviderAvailabilitySlot[]> {
  const response = await api.put<ProviderAvailabilitySlot[]>(
    "/api/provider/availability",
    { slots }
  );
  return response.data;
}
