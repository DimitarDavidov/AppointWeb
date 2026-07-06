import api from "./api";
import type { AdminUser, UpdateAdminUserRequest } from "../types/admin";

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>("/api/admin/users");
  return response.data;
}

export async function updateAdminUser(
  id: string,
  data: UpdateAdminUserRequest
): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/api/admin/users/${id}`, data);
  return response.data;
}

export async function suspendAdminUser(id: string): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/api/admin/users/${id}/suspend`);
  return response.data;
}

export async function unsuspendAdminUser(id: string): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/api/admin/users/${id}/unsuspend`);
  return response.data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/api/admin/users/${id}`);
}
