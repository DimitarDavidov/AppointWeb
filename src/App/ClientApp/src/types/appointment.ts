export interface Appointment {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  priceAtBooking: number;
}

export interface AppointmentDetail extends Appointment {
  customerUsername: string;
  customerPhoneNumber: string | null;
  providerUsername: string;
  serviceName: string;
  cancellationReason: string | null;
  pendingRescheduleStartTime: string | null;
  pendingRescheduleEndTime: string | null;
  rescheduleReason: string | null;
  rescheduleRequestedByUserId: string | null;
}

export interface CancelAppointmentRequest {
  reason?: string;
}

export interface CreateAppointmentRequest {
  providerId: string;
  serviceId: string;
  startTime: string;
}
