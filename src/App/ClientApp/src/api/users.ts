import api from "./api";

export interface Provider {
  id: string;
  username: string;
}

export async function getProviders(): Promise<Provider[]> {
  const response = await api.get<Provider[]>("/api/user/providers");
  return response.data;
}
