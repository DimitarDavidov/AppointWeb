import { useMemo, useState, type FormEvent } from "react";
import {
  cancelAppointment,
  rescheduleAppointment,
} from "../../api/appointments";
import { getErrorMessage } from "../../api/errors";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import type { AppointmentDetail } from "../../types/appointment";
import {
  formatAppointmentDateTime,
  toDatetimeLocalValue,
  toDatetimeLocalValueFromIso,
} from "../../utils/formatAppointment";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../../utils/formatService";

function getDurationMinutes(startTime: string, endTime: string): number {
  return Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60_000
  );
}

interface ProviderUpcomingAppointmentItemProps {
  appointment: AppointmentDetail;
  onUpdated: () => void;
}

export function ProviderUpcomingAppointmentItem({
  appointment,
  onUpdated,
}: ProviderUpcomingAppointmentItemProps) {
  const durationMinutes = getDurationMinutes(
    appointment.startTime,
    appointment.endTime
  );
  const customerName = capitalizeFirstLetter(appointment.customerUsername);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minStartTime = useMemo(() => toDatetimeLocalValue(new Date()), []);

  function handleOpenReschedule() {
    setRescheduleTime(toDatetimeLocalValueFromIso(appointment.startTime));
    setActionError("");
    setShowRescheduleForm(true);
  }

  function handleCloseReschedule() {
    if (isSubmitting) return;
    setShowRescheduleForm(false);
    setRescheduleTime("");
    setActionError("");
  }

  function handleOpenCancelDialog() {
    setActionError("");
    setShowCancelDialog(true);
  }

  function handleCloseCancelDialog() {
    if (isSubmitting) return;
    setShowCancelDialog(false);
  }

  async function handleConfirmCancel() {
    setActionError("");
    setIsSubmitting(true);

    try {
      await cancelAppointment(appointment.id);
      setShowCancelDialog(false);
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Could not cancel this appointment. Please try again.")
      );
      setShowCancelDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitReschedule(e: FormEvent) {
    e.preventDefault();

    if (!rescheduleTime) return;

    setActionError("");
    setIsSubmitting(true);

    try {
      await rescheduleAppointment(appointment.id, {
        startTime: new Date(rescheduleTime).toISOString(),
      });
      setShowRescheduleForm(false);
      setRescheduleTime("");
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Could not request a reschedule. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <li className="provider-appointment-item">
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel appointment?"
        confirmLabel="Yes, cancel appointment"
        cancelLabel="Keep appointment"
        isConfirming={isSubmitting}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseCancelDialog}
      >
        <p>
          This will cancel the booking with {customerName} for{" "}
          {appointment.serviceName}.
        </p>
      </ConfirmDialog>

      <div className="provider-appointment-row">
        <p className="provider-appointment-description">
          <strong>{appointment.serviceName}</strong> with {customerName} on{" "}
          {formatAppointmentDateTime(appointment.startTime)} ·{" "}
          {formatDuration(durationMinutes)} ·{" "}
          {formatPrice(appointment.priceAtBooking)}
        </p>

        <div className="provider-appointment-actions">
          <button
            type="button"
            className="provider-btn provider-btn--danger"
            disabled={isSubmitting || showRescheduleForm}
            onClick={handleOpenCancelDialog}
          >
            Cancel appointment
          </button>
          <button
            type="button"
            className="provider-btn provider-btn--secondary"
            disabled={isSubmitting}
            onClick={
              showRescheduleForm ? handleCloseReschedule : handleOpenReschedule
            }
          >
            Request reschedule
          </button>
        </div>
      </div>

      {showRescheduleForm && (
        <form
          className="provider-appointment-reschedule"
          onSubmit={handleSubmitReschedule}
        >
          <label
            className="provider-appointment-reschedule-field"
            htmlFor={`reschedule-${appointment.id}`}
          >
            Proposed new date and time
            <input
              id={`reschedule-${appointment.id}`}
              type="datetime-local"
              value={rescheduleTime}
              min={minStartTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>

          <div className="provider-appointment-reschedule-actions">
            <button
              type="submit"
              className="provider-btn provider-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reschedule request"}
            </button>
            <button
              type="button"
              className="provider-btn provider-btn--secondary"
              disabled={isSubmitting}
              onClick={handleCloseReschedule}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p className="provider-appointment-error" role="alert">
          {actionError}
        </p>
      )}
    </li>
  );
}
