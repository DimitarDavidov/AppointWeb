import api from "./api";
import type { UserProfile } from "../types/account";
import type { AuthResponse } from "../types/auth";

export async function getAccountProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/api/account");
  return response.data;
}

export async function updateEmail(email: string): Promise<AuthResponse> {
  const response = await api.patch<AuthResponse>("/api/account/email", { email });
  return response.data;
}

export async function updateUsername(username: string): Promise<AuthResponse> {
  const response = await api.patch<AuthResponse>("/api/account/username", {
    username,
  });
  return response.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.patch("/api/account/password", { currentPassword, newPassword });
}

export async function updatePhoneNumber(
  phoneNumber: string
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>("/api/account/phone-number", {
    phoneNumber: phoneNumber || null,
  });
  return response.data;
}
