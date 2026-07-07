import { useMemo, useState, type FormEvent } from "react";
import {
  cancelAppointment,
  confirmAppointment,
  rescheduleAppointment,
} from "../../api/appointments";
import { getErrorMessage } from "../../api/errors";
import { PhoneIcon } from "../Account/AccountIcons";
import { CancelAppointmentDialog } from "../Appointments/CancelAppointmentDialog";
import type { AppointmentDetail } from "../../types/appointment";
import {
  toDatetimeLocalValue,
  toDatetimeLocalValueFromIso,
} from "../../utils/formatAppointment";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentTimingLabel,
} from "../../utils/providerPanelUtils";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../../utils/formatService";
import {
  ProviderCalendarIcon,
  ProviderCancelIcon,
  ProviderClockIcon,
  ProviderCustomerIcon,
  ProviderDurationIcon,
  ProviderPriceIcon,
  ProviderRescheduleIcon,
  ProviderStatBookedIcon,
} from "./ProviderIcons";

function getDurationMinutes(startTime: string, endTime: string): number {
  return Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60_000
  );
}

interface ProviderUpcomingAppointmentItemProps {
  appointment: AppointmentDetail;
  index: number;
  onUpdated: () => void;
}

export function ProviderUpcomingAppointmentItem({
  appointment,
  index,
  onUpdated,
}: ProviderUpcomingAppointmentItemProps) {
  const durationMinutes = getDurationMinutes(
    appointment.startTime,
    appointment.endTime
  );
  const customerName = capitalizeFirstLetter(appointment.customerUsername);
  const customerPhone = appointment.customerPhoneNumber?.trim() || null;
  const timingLabel = getAppointmentTimingLabel(appointment.startTime);
  const serviceInitial = appointment.serviceName.charAt(0).toUpperCase();
  const isPending = appointment.status === "Pending";

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

  async function handleConfirmAppointment() {
    setActionError("");
    setIsSubmitting(true);

    try {
      await confirmAppointment(appointment.id);
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Could not confirm this appointment. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmCancel(reason?: string) {
    setActionError("");
    setIsSubmitting(true);

    try {
      await cancelAppointment(appointment.id, reason ? { reason } : undefined);
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
    <li
      className={`provider-appointment-item${showRescheduleForm ? " provider-appointment-item--expanded" : ""}`}
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
      <CancelAppointmentDialog
        open={showCancelDialog}
        showReasonField
        isConfirming={isSubmitting}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseCancelDialog}
      >
        <p>
          This will cancel the booking with {customerName} for{" "}
          {appointment.serviceName}. The customer will be notified by email.
        </p>
      </CancelAppointmentDialog>

      <div className="provider-appointment-row">
        <div className="provider-appointment-main">
          <div className="provider-appointment-heading">
            <span className="provider-appointment-avatar" aria-hidden="true">
              {serviceInitial}
            </span>
            <div className="provider-appointment-heading-text">
              <div className="provider-appointment-title-row">
                <h3 className="provider-appointment-title">
                  {appointment.serviceName}
                </h3>
                <span
                  className={`provider-appointment-status${
                    isPending
                      ? " provider-appointment-status--pending"
                      : " provider-appointment-status--confirmed"
                  }`}
                >
                  {isPending ? "Pending" : "Confirmed"}
                </span>
                {timingLabel && (
                  <span className="provider-appointment-timing">
                    {timingLabel}
                  </span>
                )}
              </div>
              <p className="provider-appointment-subtitle">
                {isPending ? "Requested by" : "Booked with"} {customerName}
                {customerPhone
                  ? ` · ${customerPhone}`
                  : " · No phone number provided"}
              </p>
            </div>
          </div>

          <dl className="provider-appointment-meta">
            <div className="provider-appointment-meta-item">
              <dt>
                <ProviderCustomerIcon />
                Customer
              </dt>
              <dd>{customerName}</dd>
            </div>
            <div className="provider-appointment-meta-item">
              <dt>
                <PhoneIcon />
                Phone
              </dt>
              <dd>{customerPhone ?? "Not provided"}</dd>
            </div>
            <div className="provider-appointment-meta-item">
              <dt>
                <ProviderCalendarIcon />
                Date
              </dt>
              <dd>{formatAppointmentDate(appointment.startTime)}</dd>
            </div>
            <div className="provider-appointment-meta-item">
              <dt>
                <ProviderClockIcon />
                Time
              </dt>
              <dd>{formatAppointmentTime(appointment.startTime)}</dd>
            </div>
            <div className="provider-appointment-meta-item">
              <dt>
                <ProviderDurationIcon />
                Duration
              </dt>
              <dd>{formatDuration(durationMinutes)}</dd>
            </div>
            <div className="provider-appointment-meta-item">
              <dt>
                <ProviderPriceIcon />
                Price
              </dt>
              <dd>{formatPrice(appointment.priceAtBooking)}</dd>
            </div>
          </dl>
        </div>

        <div className="provider-appointment-actions">
          {isPending && (
            <button
              type="button"
              className="provider-btn provider-btn--primary"
              disabled={isSubmitting || showRescheduleForm}
              onClick={handleConfirmAppointment}
            >
              <ProviderStatBookedIcon className="provider-btn-icon" />
              Confirm appointment
            </button>
          )}
          <button
            type="button"
            className="provider-btn provider-btn--danger"
            disabled={isSubmitting || showRescheduleForm}
            onClick={handleOpenCancelDialog}
          >
            <ProviderCancelIcon className="provider-btn-icon" />
            Cancel appointment
          </button>
          <button
            type="button"
            className={`provider-btn provider-btn--secondary${showRescheduleForm ? " provider-btn--active" : ""}`}
            disabled={isSubmitting}
            onClick={
              showRescheduleForm ? handleCloseReschedule : handleOpenReschedule
            }
          >
            <ProviderRescheduleIcon className="provider-btn-icon" />
            Request reschedule
          </button>
        </div>
      </div>

      {showRescheduleForm && (
        <form
          className="provider-appointment-reschedule"
          onSubmit={handleSubmitReschedule}
        >
          <div className="provider-appointment-reschedule-header">
            <ProviderRescheduleIcon className="provider-appointment-reschedule-icon" />
            <div>
              <p className="provider-appointment-reschedule-title">
                Propose a new time
              </p>
              <p className="provider-appointment-reschedule-copy">
                Choose when you would like to move this appointment.
              </p>
            </div>
          </div>

          <label
            className="provider-appointment-reschedule-field"
            htmlFor={`reschedule-${appointment.id}`}
          >
            New date and time
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
