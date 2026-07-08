import { useState, type FormEvent } from "react";
import { deleteRating, submitRating } from "../../api/ratings";
import { getErrorMessage } from "../../api/errors";
import type { AppointmentDetail } from "../../types/appointment";
import { StarRatingDisplay, StarRatingInput } from "./StarRating";
import "./AppointmentRatingSection.scss";

type RatingViewer = "customer" | "provider";

interface AppointmentRatingSectionProps {
  appointment: AppointmentDetail;
  viewer: RatingViewer;
  onUpdated?: () => void;
}

const COPY: Record<
  RatingViewer,
  { title: string; hint: string; placeholder: string }
> = {
  customer: {
    title: "Rate your experience",
    hint: "Optional — leave a star rating, a comment, or both. Your review is shown publicly on this service's page.",
    placeholder: "Share how the service went...",
  },
  provider: {
    title: "Rate this customer",
    hint: "Optional — leave a star rating, a comment, or both. This feedback is private.",
    placeholder: "Add a private note about this customer...",
  },
};

export function AppointmentRatingSection({
  appointment,
  viewer,
  onUpdated,
}: AppointmentRatingSectionProps) {
  const copy = COPY[viewer];

  const [savedStars, setSavedStars] = useState<number | null>(
    appointment.myRatingStars
  );
  const [savedComment, setSavedComment] = useState<string | null>(
    appointment.myRatingComment
  );
  const [hasRated, setHasRated] = useState(appointment.hasRated);

  const [isEditing, setIsEditing] = useState(false);
  const [stars, setStars] = useState<number | null>(appointment.myRatingStars);
  const [comment, setComment] = useState(appointment.myRatingComment ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const trimmedComment = comment.trim();
  const isEmpty = stars == null && trimmedComment.length === 0;

  function handleEditClick() {
    setStars(savedStars);
    setComment(savedComment ?? "");
    setError("");
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isEmpty) {
      setError("Add a star rating or a comment.");
      return;
    }

    const nextComment = trimmedComment.length > 0 ? trimmedComment : null;

    setError("");
    setIsSaving(true);

    try {
      await submitRating(appointment.id, { stars, comment: nextComment });
      setSavedStars(stars);
      setSavedComment(nextComment);
      setHasRated(true);
      setIsEditing(false);
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your rating. Please try again."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    setError("");
    setIsSaving(true);

    try {
      await deleteRating(appointment.id);
      setSavedStars(null);
      setSavedComment(null);
      setHasRated(false);
      setStars(null);
      setComment("");
      setIsEditing(false);
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err, "Could not remove your rating. Please try again."));
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="appointment-rating">
        <h3 className="appointment-rating-title">{copy.title}</h3>

        {hasRated ? (
          <div className="appointment-rating-summary">
            {savedStars != null && (
              <StarRatingDisplay value={savedStars} size="md" showValue />
            )}
            {savedComment && (
              <p className="appointment-rating-comment">“{savedComment}”</p>
            )}
            <button
              type="button"
              className="appointment-rating-link"
              onClick={handleEditClick}
            >
              Edit review
            </button>
          </div>
        ) : (
          <div className="appointment-rating-summary">
            <p className="appointment-rating-hint">{copy.hint}</p>
            <button
              type="button"
              className="appointment-rating-btn appointment-rating-btn--primary"
              onClick={handleEditClick}
            >
              Leave a review
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form className="appointment-rating" onSubmit={handleSubmit}>
      <h3 className="appointment-rating-title">{copy.title}</h3>
      <p className="appointment-rating-hint">{copy.hint}</p>

      <StarRatingInput value={stars} onChange={setStars} disabled={isSaving} />

      <textarea
        className="appointment-rating-textarea"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={copy.placeholder}
        rows={3}
        maxLength={1000}
        disabled={isSaving}
      />

      {error && (
        <p className="appointment-rating-error" role="alert">
          {error}
        </p>
      )}

      <div className="appointment-rating-actions">
        <button
          type="submit"
          className="appointment-rating-btn appointment-rating-btn--primary"
          disabled={isSaving || isEmpty}
        >
          {isSaving ? "Saving..." : "Save review"}
        </button>
        <button
          type="button"
          className="appointment-rating-btn appointment-rating-btn--secondary"
          disabled={isSaving}
          onClick={handleCancel}
        >
          Cancel
        </button>
        {hasRated && (
          <button
            type="button"
            className="appointment-rating-btn appointment-rating-btn--danger"
            disabled={isSaving}
            onClick={handleRemove}
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
