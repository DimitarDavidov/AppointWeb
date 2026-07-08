import { getMyRatings } from "../../api/ratings";
import { useAsyncData } from "../../hooks/useAsyncData";
import { UserRoles } from "../../constants/roles";
import type { CustomerRating } from "../../types/rating";
import { StarRatingDisplay } from "./StarRating";
import "./AccountRatingsSection.scss";

interface AccountRatingsSectionProps {
  role: string | null;
}

function RatingRow({ label, rating }: { label: string; rating: CustomerRating }) {
  const hasRating = rating.ratingCount > 0 && rating.averageRating != null;

  return (
    <div className="account-ratings-row">
      <span className="account-ratings-label">{label}</span>
      {hasRating ? (
        <StarRatingDisplay
          value={rating.averageRating}
          size="md"
          showValue
          count={rating.ratingCount}
        />
      ) : (
        <span className="account-ratings-empty">Not rated yet</span>
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

  return (
    <section className="account-ratings">
      <h2 className="account-ratings-title">Your ratings</h2>

      {isLoading && (
        <p className="account-ratings-status" aria-live="polite">
          Loading your ratings...
        </p>
      )}

      {error && (
        <p className="account-ratings-status account-ratings-status--error" role="alert">
          {error}
        </p>
      )}

      {data && (
        <div className="account-ratings-rows">
          <RatingRow label="As a customer" rating={data.asCustomer} />
          {showProviderRating && (
            <RatingRow label="As a provider" rating={data.asProvider} />
          )}
        </div>
      )}
    </section>
  );
}
