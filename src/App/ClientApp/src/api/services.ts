import api from "./api";
import type { Service } from "../types/service";

export async function getServices(): Promise<Service[]> {
  const response = await api.get<Service[]>("/api/services");
  return response.data;
}

export async function getServiceById(id: string): Promise<Service> {
  const response = await api.get<Service>(`/api/services/${id}`);
  return response.data;
}
