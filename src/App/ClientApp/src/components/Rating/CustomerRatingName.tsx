import { useState } from "react";
import { getCustomerRating } from "../../api/ratings";
import { getErrorMessage } from "../../api/errors";
import type { CustomerRating } from "../../types/rating";
import { StarRatingDisplay } from "./StarRating";
import "./CustomerRatingName.scss";

interface CustomerRatingNameProps {
  customerId: string;
  name: string;
}

export function CustomerRatingName({ customerId, name }: CustomerRatingNameProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<CustomerRating | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    const next = !open;
    setOpen(next);

    if (!next || loaded || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      setRating(await getCustomerRating(customerId));
      setLoaded(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this customer's rating."));
    } finally {
      setIsLoading(false);
    }
  }

  const hasRating =
    rating != null && rating.ratingCount > 0 && rating.averageRating != null;

  return (
    <span className="customer-rating">
      <button
        type="button"
        className="customer-rating-name"
        aria-expanded={open}
        onClick={handleToggle}
      >
        {name}
      </button>

      {open && (
        <span className="customer-rating-detail">
          {isLoading && (
            <span className="customer-rating-status">Loading rating…</span>
          )}
          {error && (
            <span className="customer-rating-status customer-rating-status--error">
              {error}
            </span>
          )}
          {loaded && !error && (
            hasRating ? (
              <StarRatingDisplay
                value={rating!.averageRating}
                size="sm"
                showValue
                count={rating!.ratingCount}
              />
            ) : (
              <span className="customer-rating-status">No ratings yet</span>
            )
          )}
        </span>
      )}
    </span>
  );
}
