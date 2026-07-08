import api from "./api";
import type {
  CustomerRating,
  Rating,
  ServiceReviews,
  SubmitRatingRequest,
  UserRatingSummary,
} from "../types/rating";

export async function getMyRating(
  appointmentId: string
): Promise<Rating | null> {
  const response = await api.get<Rating | "">(
    `/api/ratings/appointments/${appointmentId}`
  );
  return response.status === 204 || !response.data ? null : response.data;
}

export async function submitRating(
  appointmentId: string,
  data: SubmitRatingRequest
): Promise<Rating> {
  const response = await api.put<Rating>(
    `/api/ratings/appointments/${appointmentId}`,
    data
  );
  return response.data;
}

export async function deleteRating(appointmentId: string): Promise<void> {
  await api.delete(`/api/ratings/appointments/${appointmentId}`);
}

export async function getServiceReviews(
  providerId: string,
  serviceId: string
): Promise<ServiceReviews> {
  const response = await api.get<ServiceReviews>(
    `/api/catalog/${providerId}/${serviceId}/reviews`
  );
  return response.data;
}

export async function getCustomerRating(
  customerId: string
): Promise<CustomerRating> {
  const response = await api.get<CustomerRating>(
    `/api/ratings/customers/${customerId}`
  );
  return response.data;
}

export async function getMyRatings(): Promise<UserRatingSummary> {
  const response = await api.get<UserRatingSummary>("/api/ratings/me");
  return response.data;
}
