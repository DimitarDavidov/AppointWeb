import api from "./api";
import type { CatalogOffering } from "../types/catalog";

export interface BookingSlotsResponse {
  durationMinutes: number;
  slots: string[];
}

export async function getCatalogOfferings(): Promise<CatalogOffering[]> {
  const response = await api.get<CatalogOffering[]>("/api/catalog");
  return response.data;
}

export async function getCatalogOffering(
  providerId: string,
  serviceId: string
): Promise<CatalogOffering> {
  const response = await api.get<CatalogOffering>(
    `/api/catalog/${providerId}/${serviceId}`
  );
  return response.data;
}

export async function getBookingSlots(
  providerId: string,
  serviceId: string,
  from: Date,
  to: Date
): Promise<BookingSlotsResponse> {
  const response = await api.get<BookingSlotsResponse>(
    `/api/catalog/${providerId}/${serviceId}/slots`,
    {
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }
  );
  return response.data;
}
