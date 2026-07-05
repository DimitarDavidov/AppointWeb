import api from "./api";
import type { CatalogOffering } from "../types/catalog";

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
