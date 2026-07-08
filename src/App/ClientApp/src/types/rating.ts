export type RatingDirection = "CustomerToProvider" | "ProviderToCustomer";

export interface Rating {
  id: string;
  appointmentId: string;
  direction: RatingDirection;
  stars: number | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitRatingRequest {
  stars?: number | null;
  comment?: string | null;
}

export interface ServiceReview {
  stars: number | null;
  comment: string | null;
  reviewerId: string;
  reviewerUsername: string;
  createdAt: string;
}

export interface ServiceReviews {
  averageRating: number | null;
  ratingCount: number;
  reviews: ServiceReview[];
}

export interface CustomerRating {
  averageRating: number | null;
  ratingCount: number;
}

export interface UserRatingSummary {
  asCustomer: CustomerRating;
  asProvider: CustomerRating;
}
