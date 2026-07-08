export interface ProviderServiceDetail {
  serviceId: string;
  serviceName: string;
  description: string | null;
  category: string | null;
  country: string;
  city: string;
  isRemote: boolean;
  durationMinutes: number;
  price: number;
}

export interface UpdateProviderServiceRequest {
  name: string;
  description: string | null;
  category: string;
  isRemote: boolean;
  country: string;
  city: string;
  durationMinutes: number;
  price: number;
}

export type CreateProviderServiceRequest = UpdateProviderServiceRequest;

export interface ProviderAvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ProviderAvailabilitySlotInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
