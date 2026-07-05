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

export interface CreateAppointmentRequest {
  providerId: string;
  serviceId: string;
  startTime: string;
}
