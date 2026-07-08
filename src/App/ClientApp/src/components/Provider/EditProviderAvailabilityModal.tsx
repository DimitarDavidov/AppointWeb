import { useEffect, useState, type FormEvent } from "react";
import {
  getProviderServiceAvailability,
} from "../../api/provider";
import { getErrorMessage } from "../../api/errors";
import type { ProviderAvailabilitySlotInput } from "../../types/provider";
import {
  PROVIDER_WEEKDAYS,
  formatAvailabilitySlot,
} from "../../utils/providerAvailability";

export interface EditProviderAvailabilityModalProps {
  open: boolean;
  serviceId: string | null;
  serviceName: string;
  isSaving: boolean;
  error: string;
  onSave: (slots: ProviderAvailabilitySlotInput[]) => void;
  onClose: () => void;
}

interface DraftSlot {
  key: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function createDraftSlot(
  slot?: Partial<ProviderAvailabilitySlotInput>
): DraftSlot {
  return {
    key: crypto.randomUUID(),
    dayOfWeek: slot?.dayOfWeek ?? 1,
    startTime: slot?.startTime ?? "09:00",
    endTime: slot?.endTime ?? "17:00",
  };
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
  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open || !serviceId) return;

    let cancelled = false;

    async function loadAvailability() {
      setIsLoading(true);
      setLoadError("");
      setValidationError("");

      try {
        const data = await getProviderServiceAvailability(serviceId);
        if (cancelled) return;

        setSlots(
          data.length > 0
            ? data.map((slot) =>
                createDraftSlot({
                  dayOfWeek: slot.dayOfWeek,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                })
              )
            : [createDraftSlot()]
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            getErrorMessage(err, "Could not load availability. Please try again.")
          );
          setSlots([createDraftSlot()]);
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

  function handleAddSlot() {
    setSlots((current) => [...current, createDraftSlot()]);
  }

  function handleRemoveSlot(key: string) {
    setSlots((current) => current.filter((slot) => slot.key !== key));
  }

  function handleSlotChange(
    key: string,
    field: keyof Omit<DraftSlot, "key">,
    value: string | number
  ) {
    setSlots((current) =>
      current.map((slot) =>
        slot.key === key ? { ...slot, [field]: value } : slot
      )
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (slots.length === 0) {
      setValidationError("Add at least one availability window.");
      return;
    }

    for (const slot of slots) {
      if (slot.endTime <= slot.startTime) {
        setValidationError(
          `${formatAvailabilitySlot(slot.dayOfWeek, slot.startTime, slot.endTime)} must end after it starts.`
        );
        return;
      }
    }

    setValidationError("");
    onSave(
      slots.map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }))
    );
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
        className="provider-modal provider-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-provider-availability-title"
      >
        <header className="provider-modal-header">
          <h2
            id="edit-provider-availability-title"
            className="provider-modal-title"
          >
            Booking hours
          </h2>
          <p className="provider-modal-subtitle">
            Set when customers can book <strong>{serviceName}</strong>. Other
            services keep their own schedule.
          </p>
        </header>

        {isLoading ? (
          <p className="provider-modal-loading">Loading availability...</p>
        ) : (
          <form className="provider-modal-form" onSubmit={handleSubmit}>
            <ul className="provider-availability-list">
              {slots.map((slot) => (
                <li key={slot.key} className="provider-availability-item">
                  <div className="provider-availability-item-fields">
                    <div className="provider-modal-field">
                      <label htmlFor={`availability-day-${slot.key}`}>Day</label>
                      <select
                        id={`availability-day-${slot.key}`}
                        value={slot.dayOfWeek}
                        onChange={(e) =>
                          handleSlotChange(
                            slot.key,
                            "dayOfWeek",
                            Number(e.target.value)
                          )
                        }
                        disabled={isSaving}
                      >
                        {PROVIDER_WEEKDAYS.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="provider-modal-field">
                      <label htmlFor={`availability-start-${slot.key}`}>
                        Start
                      </label>
                      <input
                        id={`availability-start-${slot.key}`}
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleSlotChange(slot.key, "startTime", e.target.value)
                        }
                        disabled={isSaving}
                        required
                      />
                    </div>

                    <div className="provider-modal-field">
                      <label htmlFor={`availability-end-${slot.key}`}>End</label>
                      <input
                        id={`availability-end-${slot.key}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleSlotChange(slot.key, "endTime", e.target.value)
                        }
                        disabled={isSaving}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="provider-availability-remove"
                    disabled={isSaving || slots.length === 1}
                    onClick={() => handleRemoveSlot(slot.key)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="provider-availability-add"
              disabled={isSaving}
              onClick={handleAddSlot}
            >
              Add hours
            </button>

            {displayError && (
              <p className="provider-modal-error" role="alert">
                {displayError}
              </p>
            )}

            <div className="provider-modal-actions">
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
