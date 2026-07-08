import { getServiceReviews } from "../../api/ratings";
import { useAsyncData } from "../../hooks/useAsyncData";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { CustomerRatingName } from "./CustomerRatingName";
import { StarRatingDisplay } from "./StarRating";
import "./ServiceReviewsSection.scss";

interface ServiceReviewsSectionProps {
  providerId: string;
  serviceId: string;
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ServiceReviewsSection({
  providerId,
  serviceId,
}: ServiceReviewsSectionProps) {
  const {
    data,
    isLoading,
    error,
  } = useAsyncData(
    () => getServiceReviews(providerId, serviceId),
    [providerId, serviceId],
    { errorMessage: "Could not load reviews." }
  );

  if (isLoading) {
    return (
      <section className="service-reviews">
        <h2 className="service-reviews-title">Reviews</h2>
        <p className="service-reviews-status">Loading reviews...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="service-reviews">
        <h2 className="service-reviews-title">Reviews</h2>
        <p className="service-reviews-status">{error || "Could not load reviews."}</p>
      </section>
    );
  }

  return (
    <section className="service-reviews">
      <div className="service-reviews-header">
        <h2 className="service-reviews-title">Reviews</h2>
        {data.ratingCount > 0 ? (
          <div className="service-reviews-summary">
            <StarRatingDisplay
              value={data.averageRating}
              size="lg"
              showValue
              count={data.ratingCount}
            />
            <span className="service-reviews-count">
              {data.ratingCount} rating{data.ratingCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <p className="service-reviews-status">No ratings yet.</p>
        )}
      </div>

      {data.reviews.length > 0 ? (
        <ul className="service-reviews-list">
          {data.reviews.map((review, index) => (
            <li className="service-reviews-item" key={index}>
              <div className="service-reviews-item-head">
                <span className="service-reviews-author">
                  <CustomerRatingName
                    customerId={review.reviewerId}
                    name={capitalizeFirstLetter(review.reviewerUsername)}
                  />
                </span>
                <span className="service-reviews-date">
                  {formatReviewDate(review.createdAt)}
                </span>
              </div>
              {review.stars != null && (
                <StarRatingDisplay value={review.stars} size="sm" />
              )}
              {review.comment && (
                <p className="service-reviews-comment">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        data.ratingCount > 0 && (
          <p className="service-reviews-status">No written reviews yet.</p>
        )
      )}
    </section>
  );
}
