export type ProviderAppointmentTab =
  | "appointments"
  | "pending"
  | "past"
  | "cancelled";

export const PROVIDER_TAB_ORDER: ProviderAppointmentTab[] = [
  "appointments",
  "pending",
  "past",
  "cancelled",
];
