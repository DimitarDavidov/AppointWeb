import type { UserRole } from "../constants/roles";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
  serviceCount: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
}

export interface AdminServiceStats {
  serviceId: string;
  serviceName: string;
  category: string | null;
  price: number;
  isActive: boolean;
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  revenue: number;
}

export interface AdminCancelledAppointment {
  id: string;
  serviceName: string;
  customerUsername: string;
  providerUsername: string;
  startTime: string;
  endTime: string;
  priceAtBooking: number;
  cancellationReason: string | null;
  createdAt: string;
}

export interface UpdateAdminUserRequest {
  username: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
}
