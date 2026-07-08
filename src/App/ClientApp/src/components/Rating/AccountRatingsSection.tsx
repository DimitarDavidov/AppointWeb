import { getMyRatings } from "../../api/ratings";
import { useAsyncData } from "../../hooks/useAsyncData";
import { UserRoles } from "../../constants/roles";
import type { CustomerRating } from "../../types/rating";
import { StarRatingDisplay } from "./StarRating";
import "./AccountRatingsSection.scss";

interface AccountRatingsSectionProps {
  role: string | null;
}

interface RatingBadgeProps {
  label: string;
  rating: CustomerRating;
  position: "left" | "right";
}

function reviewCountLabel(count: number): string {
  return count === 1 ? "1 review" : `${count} reviews`;
}

function RatingBadge({ label, rating, position }: RatingBadgeProps) {
  const hasRating = rating.ratingCount > 0 && rating.averageRating != null;

  return (
    <div
      className={`rating-badge rating-badge--${position}`}
      aria-label={`${label}: ${
        hasRating
          ? `${rating.averageRating} out of 5 from ${reviewCountLabel(rating.ratingCount)}`
          : "not rated yet"
      }`}
    >
      <span className="rating-badge-label">{label}</span>

      {hasRating ? (
        <>
          <StarRatingDisplay value={rating.averageRating} size="xl" />
          <span className="rating-badge-score">
            {rating.averageRating!.toFixed(1)}
            <span className="rating-badge-score-max"> / 5</span>
          </span>
          <span className="rating-badge-count">
            {reviewCountLabel(rating.ratingCount)}
          </span>
        </>
      ) : (
        <>
          <StarRatingDisplay value={null} size="xl" />
          <span className="rating-badge-empty">No reviews yet</span>
        </>
      )}
    </div>
  );
}

export function AccountRatingsSection({ role }: AccountRatingsSectionProps) {
  const { data, isLoading, error } = useAsyncData(getMyRatings, [], {
    errorMessage: "Could not load your ratings.",
  });

  const showProviderRating =
    role === UserRoles.Provider || role === UserRoles.Admin;

  if (isLoading || error || !data) {
    return (
      <div
        className={`account-ratings${showProviderRating ? "" : " account-ratings--single"}`}
        aria-live="polite"
      >
        {isLoading && (
          <p className="rating-badge rating-badge--placeholder">
            Loading ratings…
          </p>
        )}
        {error && (
          <p className="rating-badge rating-badge--error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`account-ratings${showProviderRating ? "" : " account-ratings--single"}`}
    >
      <RatingBadge
        label="Customer rating"
        rating={data.asCustomer}
        position="left"
      />

      {showProviderRating && (
        <RatingBadge
          label="Provider rating"
          rating={data.asProvider}
          position="right"
        />
      )}
    </div>
  );
}
