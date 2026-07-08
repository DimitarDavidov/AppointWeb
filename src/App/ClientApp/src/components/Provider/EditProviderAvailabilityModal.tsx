import { useEffect, useState, type FormEvent } from "react";
import { getProviderServiceAvailability } from "../../api/provider";
import { getAccountProfile } from "../../api/account";
import { getErrorMessage } from "../../api/errors";
import { WeekAvailabilityGrid } from "../Calendar/WeekAvailabilityGrid";
import type { ProviderAvailabilitySlotInput } from "../../types/provider";

export interface EditProviderAvailabilityModalProps {
  open: boolean;
  serviceId: string | null;
  serviceName: string;
  isSaving: boolean;
  error: string;
  onSave: (slots: ProviderAvailabilitySlotInput[]) => void;
  onClose: () => void;
}

function EditProviderAvailabilityModal({
  open,
  serviceId,
  serviceName,
  isSaving,
  error,
  onSave,
  onClose,
}: EditProviderAvailabilityModalProps) {
  const [draftSlots, setDraftSlots] = useState<ProviderAvailabilitySlotInput[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [gridKey, setGridKey] = useState(0);
  const [timeZoneId, setTimeZoneId] = useState("");

  useEffect(() => {
    if (!open || !serviceId) return;

    let cancelled = false;

    async function loadAvailability() {
      if (!serviceId) return;

      setIsLoading(true);
      setLoadError("");
      setValidationError("");

      try {
        const data = await getProviderServiceAvailability(serviceId);
        if (cancelled) return;

        setDraftSlots(
          data.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))
        );
        setGridKey((value) => value + 1);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            getErrorMessage(err, "Could not load availability. Please try again.")
          );
          setDraftSlots([]);
          setGridKey((value) => value + 1);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [open, serviceId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    getAccountProfile()
      .then((profile) => {
        if (!cancelled) setTimeZoneId(profile.timeZoneId);
      })
      .catch(() => {
        // Non-critical: the hint just won't show a specific zone.
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, isSaving, onClose]);

  if (!open || !serviceId) {
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (draftSlots.length === 0) {
      setValidationError("Paint at least one available block on the grid.");
      return;
    }

    for (const slot of draftSlots) {
      if (slot.endTime <= slot.startTime) {
        setValidationError("Each availability window must end after it starts.");
        return;
      }
    }

    setValidationError("");
    onSave(draftSlots);
  }

  const displayError = validationError || error || loadError;

  return (
    <div className="provider-modal-root" role="presentation">
      <button
        type="button"
        className="provider-modal-backdrop"
        aria-label="Close availability editor"
        disabled={isSaving}
        onClick={onClose}
      />

      <div
        className="provider-modal provider-modal--wide provider-modal--calendar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-provider-availability-title"
      >
        <header className="provider-modal-header provider-modal-header--toolbar">
          <div>
            <h2
              id="edit-provider-availability-title"
              className="provider-modal-title"
            >
              Booking hours
            </h2>
            <p className="provider-modal-subtitle">
              Set when customers can book <strong>{serviceName}</strong>. Other
              services keep their own schedule.
              {timeZoneId && (
                <>
                  {" "}
                  Hours are in your timezone (<strong>{timeZoneId}</strong>), set
                  on your account page.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            className="provider-modal-close"
            aria-label="Close"
            disabled={isSaving}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {isLoading ? (
          <p className="provider-modal-loading">Loading availability...</p>
        ) : (
          <form
            className="provider-modal-form provider-modal-form--calendar"
            onSubmit={handleSubmit}
          >
            <div className="provider-modal-body">
              <WeekAvailabilityGrid
                key={gridKey}
                slots={draftSlots}
                disabled={isSaving}
                onChange={setDraftSlots}
              />

              {displayError && (
                <p className="provider-modal-error" role="alert">
                  {displayError}
                </p>
              )}
            </div>

            <div className="provider-modal-actions provider-modal-actions--sticky">
              <button
                type="button"
                className="provider-modal-btn provider-modal-btn-secondary"
                disabled={isSaving}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="provider-modal-btn provider-modal-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save hours"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditProviderAvailabilityModal;
