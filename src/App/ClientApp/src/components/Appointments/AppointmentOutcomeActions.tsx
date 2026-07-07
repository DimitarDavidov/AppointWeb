import { useState } from "react";
import {
  updateAppointmentStatus,
  type AppointmentOutcomeStatus,
} from "../../api/appointments";
import { getErrorMessage } from "../../api/errors";
import type { AppointmentOutcomeViewer } from "../../utils/appointmentOutcomeUtils";
import { getOutcomeActionLabels } from "../../utils/appointmentOutcomeUtils";

interface AppointmentOutcomeActionsProps {
  viewer: AppointmentOutcomeViewer;
  isSubmitting?: boolean;
  onSubmit: (status: AppointmentOutcomeStatus) => Promise<void>;
  className?: string;
  buttonClassPrefix?: "appointments" | "provider";
}

export function AppointmentOutcomeActions({
  viewer,
  isSubmitting = false,
  onSubmit,
  className = "",
  buttonClassPrefix = "appointments",
}: AppointmentOutcomeActionsProps) {
  const [actionError, setActionError] = useState("");
  const labels = getOutcomeActionLabels(viewer);
  const btn = (suffix: string) =>
    buttonClassPrefix === "provider"
      ? `provider-btn provider-btn--${suffix}`
      : `appointments-btn appointments-btn-${suffix}`;

  async function handleSetStatus(status: AppointmentOutcomeStatus) {
    setActionError("");

    try {
      await onSubmit(status);
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Could not update this appointment status. Please try again."
        )
      );
    }
  }

  return (
    <div className={className}>
      <p className={`${buttonClassPrefix}-outcome-prompt`}>{labels.prompt}</p>
      <p className={`${buttonClassPrefix}-outcome-hint`}>{labels.hint}</p>
      <div
        className={
          buttonClassPrefix === "provider"
            ? "provider-appointment-actions"
            : "appointments-card-actions"
        }
      >
        <button
          type="button"
          className={btn("primary")}
          disabled={isSubmitting}
          onClick={() => handleSetStatus("Completed")}
        >
          {isSubmitting ? "Saving..." : labels.completed}
        </button>
        <button
          type="button"
          className={btn("secondary")}
          disabled={isSubmitting}
          onClick={() => handleSetStatus("NoShow")}
        >
          {labels.notCompleted}
        </button>
      </div>
      {actionError && (
        <p
          className={
            buttonClassPrefix === "provider"
              ? "provider-appointment-error"
              : "appointments-card-action-error"
          }
          role="alert"
        >
          {actionError}
        </p>
      )}
    </div>
  );
}
