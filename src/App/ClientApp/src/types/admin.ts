import type { UserRole } from "../constants/roles";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
}

export interface UpdateAdminUserRequest {
  username: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
}
