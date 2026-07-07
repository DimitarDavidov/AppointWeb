export interface ProviderServiceDetail {
  serviceId: string;
  serviceName: string;
  description: string | null;
  category: string | null;
  durationMinutes: number;
  price: number;
}

export interface UpdateProviderServiceRequest {
  name: string;
  description: string | null;
  category: string | null;
  durationMinutes: number;
  price: number;
}

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

export type ProviderServiceEditFocus =
  | "title"
  | "description"
  | "price"
  | "duration"
  | "category";
