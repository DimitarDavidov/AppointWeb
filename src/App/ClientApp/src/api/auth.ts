import api from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/register", data);
  return response.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/login", data);
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/api/auth/forgot-password", { email });
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  await api.post("/api/auth/reset-password", data);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
    ) {
      return (data as { message: string }).message;
    }
  }

  return fallback;
}
