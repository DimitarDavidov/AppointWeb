export interface CatalogOffering {
  providerId: string;
  providerUsername: string;
  serviceId: string;
  serviceName: string;
  description: string | null;
  category: string | null;
  country: string;
  city: string;
  durationMinutes: number;
  price: number;
}
