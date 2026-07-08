import { useState, type FormEvent } from "react";
import {
  acceptReschedule,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "../../api/appointments";
import { getErrorMessage } from "../../api/errors";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import { AppointmentOutcomeActions } from "./AppointmentOutcomeActions";
import { AppointmentRescheduleMeta } from "./AppointmentRescheduleMeta";
import { AppointmentBookingPicker } from "../Calendar/AppointmentBookingPicker";
import { isActiveAppointmentStatus } from "../../utils/providerPanelUtils";
import {
  canAcceptReschedule,
  hasPendingReschedule,
  isRescheduleAwaitingResponse,
} from "../../utils/appointmentRescheduleUtils";
import { getCancelledByLabel } from "../../utils/appointmentCancellationUtils";
import {
  getOutcomeStatusLabel,
  needsAppointmentOutcome,
} from "../../utils/appointmentOutcomeUtils";
import { UserRoles } from "../../constants/roles";
import { useAppSelector } from "../../store/hooks";
import { isSameId } from "../../utils/isSameId";
import type { AppointmentDetail } from "../../types/appointment";
import { formatAppointmentDateTime, getDurationMinutes } from "../../utils/formatAppointment";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../../utils/formatService";

function formatStatusLabel(
  status: string,
  hasReschedulePending: boolean,
  viewer: "customer" | "provider"
): string {
  if (hasReschedulePending) {
    return "Reschedule pending";
  }

  if (status === "Completed" || status === "NoShow") {
    return getOutcomeStatusLabel(status, viewer);
  }

  switch (status) {
    case "Booked":
      return "Confirmed";
    case "Pending":
      return "Pending";
    case "Cancelled":
      return "Cancelled";
    case "Completed":
      return "Completed";
    case "NoShow":
      return "No show";
    default:
      return status;
  }
}

function statusClassName(status: string): string {
  switch (status) {
    case "Booked":
      return "appointments-card-status--booked";
    case "Pending":
      return "appointments-card-status--pending";
    case "Cancelled":
      return "appointments-card-status--cancelled";
    case "Completed":
      return "appointments-card-status--completed";
    case "NoShow":
      return "appointments-card-status--no-show";
    default:
      return "";
  }
}

interface AppointmentCardProps {
  appointment: AppointmentDetail;
  onUpdated: () => void;
}

export function AppointmentCard({
  appointment,
  onUpdated,
}: AppointmentCardProps) {
  const { userId, role } = useAppSelector((state) => state.auth);
  const durationMinutes = getDurationMinutes(
    appointment.startTime,
    appointment.endTime
  );
  const isCustomerView = isSameId(userId, appointment.customerId);
  const isProviderView = isSameId(userId, appointment.providerId);
  const isAdminView = role === UserRoles.Admin;
  const canModify = isActiveAppointmentStatus(appointment.status);
  const showProviderCancelReason = isProviderView && !isCustomerView;
  const showCustomerCancelReason = isCustomerView;
  const pendingReschedule = hasPendingReschedule(appointment);
  const needsOutcome = needsAppointmentOutcome(appointment);
  const outcomeViewer = isCustomerView ? "customer" : "provider";
  const canManageActive = canModify && !needsOutcome;
  const canAcceptRescheduleRequest = canAcceptReschedule(appointment, userId);
  const awaitingRescheduleResponse = isRescheduleAwaitingResponse(
    appointment,
    userId
  );
  const cancelledByLabel =
    appointment.status === "Cancelled"
      ? getCancelledByLabel(appointment, userId)
      : null;

  const [isEditing, setIsEditing] = useState(false);
  const [showCounterProposalForm, setShowCounterProposalForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editStartTime, setEditStartTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSetOutcome(status: "Completed" | "NoShow") {
    setIsSubmitting(true);

    try {
      await updateAppointmentStatus(appointment.id, status);
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }

  const counterpartName = capitalizeFirstLetter(
    isCustomerView || (isAdminView && !isProviderView)
      ? appointment.providerUsername
      : appointment.customerUsername
  );
  const counterpartLabel =
    isCustomerView || (isAdminView && !isProviderView) ? "Provider" : "Customer";

  function handleEditClick() {
    setEditStartTime("");
    setEditReason("");
    setActionError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setShowCounterProposalForm(false);
    setActionError("");
    setEditStartTime("");
    setEditReason("");
  }

  function handleOpenCounterProposal() {
    setEditStartTime("");
    setEditReason("");
    setActionError("");
    setShowCounterProposalForm(true);
  }

  async function handleAcceptReschedule() {
    setActionError("");
    setIsSubmitting(true);

    try {
      await acceptReschedule(appointment.id);
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Could not accept this reschedule. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelClick() {
    setActionError("");
    setShowCancelDialog(true);
  }

  function handleCloseCancelDialog() {
    if (isSubmitting) return;
    setShowCancelDialog(false);
  }

  async function handleConfirmCancel(reason?: string) {
    setActionError("");
    setIsSubmitting(true);

    try {
      await cancelAppointment(
        appointment.id,
        reason ? { reason } : undefined
      );
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

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();

    if (!editStartTime) return;

    const trimmedReason = editReason.trim();
    if (isProviderView && !trimmedReason) {
      setActionError("Please add a reason for the reschedule.");
      return;
    }

    setActionError("");
    setIsSubmitting(true);

    try {
      await rescheduleAppointment(appointment.id, {
        startTime: new Date(editStartTime).toISOString(),
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      });
      setIsEditing(false);
      setShowCounterProposalForm(false);
      setEditReason("");
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Could not reschedule this appointment. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <li className="appointments-card">
      <CancelAppointmentDialog
        open={showCancelDialog}
        showReasonField={showProviderCancelReason || showCustomerCancelReason}
        reasonAudience={
          showCustomerCancelReason ? "provider" : "customer"
        }
        isConfirming={isSubmitting}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseCancelDialog}
      >
        <p>
          {showProviderCancelReason
            ? "This will cancel the customer's booking. They will be notified by email."
            : "This will cancel your booking. Your provider will be notified by email."}
        </p>
        <ul className="confirm-dialog-summary">
          <li>
            <span>Service</span>
            <span>{appointment.serviceName}</span>
          </li>
          <li>
            <span>{counterpartLabel}</span>
            <span>{counterpartName}</span>
          </li>
          <li>
            <span>When</span>
            <span>{formatAppointmentDateTime(appointment.startTime)}</span>
          </li>
          <li>
            <span>Price</span>
            <span>{formatPrice(appointment.priceAtBooking)}</span>
          </li>
        </ul>
      </CancelAppointmentDialog>

      <div className="appointments-card-header">
        <div className="appointments-card-heading">
          <h2 className="appointments-card-title">{appointment.serviceName}</h2>
          <span
            className={`appointments-card-status ${statusClassName(appointment.status)}`}
          >
            {formatStatusLabel(appointment.status, pendingReschedule, outcomeViewer)}
          </span>
        </div>
      </div>

      <p className="appointments-card-description">
        {counterpartLabel} {counterpartName} · {formatDuration(durationMinutes)} ·{" "}
        {formatPrice(appointment.priceAtBooking)}
      </p>

      {appointment.status === "Cancelled" &&
        (cancelledByLabel || appointment.cancellationReason) && (
        <div className="appointments-card-cancellation-info">
          {cancelledByLabel && (
            <p className="appointments-card-cancellation-by">
              <span>Cancelled by</span>
              {cancelledByLabel}
            </p>
          )}
          {appointment.cancellationReason && (
            <p className="appointments-card-cancellation-reason">
              <span>Cancellation reason</span>
              {appointment.cancellationReason}
            </p>
          )}
        </div>
      )}

      <dl className="appointments-card-meta">
        {isCustomerView && (
          <div className="appointments-card-meta-item">
            <dt>Provider</dt>
            <dd>{capitalizeFirstLetter(appointment.providerUsername)}</dd>
          </div>
        )}

        {isProviderView && (
          <div className="appointments-card-meta-item">
            <dt>Customer</dt>
            <dd>{capitalizeFirstLetter(appointment.customerUsername)}</dd>
          </div>
        )}

        {isAdminView && !isCustomerView && !isProviderView && (
          <>
            <div className="appointments-card-meta-item">
              <dt>Customer</dt>
              <dd>{capitalizeFirstLetter(appointment.customerUsername)}</dd>
            </div>
            <div className="appointments-card-meta-item">
              <dt>Provider</dt>
              <dd>{capitalizeFirstLetter(appointment.providerUsername)}</dd>
            </div>
          </>
        )}

        <div className="appointments-card-meta-item">
          <dt>When</dt>
          <dd>{formatAppointmentDateTime(appointment.startTime)}</dd>
        </div>

        <div className="appointments-card-meta-item">
          <dt>Duration</dt>
          <dd>{formatDuration(durationMinutes)}</dd>
        </div>

        <AppointmentRescheduleMeta appointment={appointment} variant="appointments" />
      </dl>

      {pendingReschedule && (
        <div className="appointments-card-reschedule-pending">
          <p className="appointments-card-reschedule-pending-title">
            {canAcceptRescheduleRequest
              ? "Reschedule request"
              : "Reschedule pending"}
          </p>
          <p className="appointments-card-reschedule-pending-copy">
            {canAcceptRescheduleRequest
              ? `${counterpartName} has requested to move this appointment to a new time.`
              : `Waiting for ${counterpartName} to respond to your reschedule request.`}
          </p>
          <dl className="appointments-card-reschedule-pending-times">
            <div>
              <dt>Current time</dt>
              <dd>{formatAppointmentDateTime(appointment.startTime)}</dd>
            </div>
            {appointment.counteredRescheduleStartTime && (
              <div>
                <dt>Previously requested time</dt>
                <dd>
                  {formatAppointmentDateTime(
                    appointment.counteredRescheduleStartTime
                  )}
                </dd>
              </div>
            )}
            <div>
              <dt>Requested time</dt>
              <dd>
                {formatAppointmentDateTime(appointment.pendingRescheduleStartTime!)}
              </dd>
            </div>
          </dl>
          {appointment.rescheduleReason && (
            <p className="appointments-card-reschedule-pending-reason">
              <span>Reason</span>
              {appointment.rescheduleReason}
            </p>
          )}
        </div>
      )}

      {needsOutcome && isCustomerView && (
        <div className="appointments-card-outcome">
          <span className="appointments-card-outcome-badge">Needs update</span>
          <AppointmentOutcomeActions
            viewer="customer"
            isSubmitting={isSubmitting}
            onSubmit={handleSetOutcome}
          />
        </div>
      )}

      {(isEditing || showCounterProposalForm) ? (
        <form className="appointments-card-edit" onSubmit={handleSaveEdit}>
          <div className="appointments-card-edit-field">
            <span className="appointments-card-edit-label">
              {showCounterProposalForm
                ? "Propose another time"
                : "New date and time"}
            </span>
            <AppointmentBookingPicker
              providerId={appointment.providerId}
              serviceId={appointment.serviceId}
              durationMinutes={durationMinutes}
              selectedStart={editStartTime || null}
              onSelect={setEditStartTime}
            />
          </div>

          <label
            className="appointments-card-edit-field"
            htmlFor={`edit-reason-${appointment.id}`}
          >
            Reason for reschedule
            {!isCustomerView && (
              <span className="appointments-card-edit-required">(required)</span>
            )}
            {isCustomerView && (
              <span className="appointments-card-edit-optional">(optional)</span>
            )}
            <textarea
              id={`edit-reason-${appointment.id}`}
              className="appointments-card-edit-textarea"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder={
                isCustomerView
                  ? "Let your provider know why you need a different time..."
                  : "Let the customer know why this appointment is being rescheduled..."
              }
              rows={4}
              maxLength={1000}
              required={!isCustomerView}
              disabled={isSubmitting}
            />
            <span className="appointments-card-edit-hint">
              {showCounterProposalForm || isCustomerView
                ? "Your provider will receive an email about this reschedule request."
                : "The customer will receive an email about this reschedule request."}
            </span>
          </label>

          {actionError && (
            <p className="appointments-card-action-error" role="alert">
              {actionError}
            </p>
          )}

          <div className="appointments-card-actions">
            <button
              type="submit"
              className="appointments-btn appointments-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Sending..."
                : showCounterProposalForm
                  ? "Send proposal"
                  : isCustomerView
                    ? "Request reschedule"
                    : "Send reschedule request"}
            </button>
            <button
              type="button"
              className="appointments-btn appointments-btn-secondary"
              disabled={isSubmitting}
              onClick={handleCancelEdit}
            >
              {showCounterProposalForm ? "Back" : "Cancel edit"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {actionError && (
            <p className="appointments-card-action-error" role="alert">
              {actionError}
            </p>
          )}

          {canManageActive && canAcceptRescheduleRequest && !showCounterProposalForm && (
            <div className="appointments-card-actions">
              <button
                type="button"
                className="appointments-btn appointments-btn-primary"
                disabled={isSubmitting}
                onClick={handleAcceptReschedule}
              >
                {isSubmitting ? "Accepting..." : "Accept reschedule"}
              </button>
              <button
                type="button"
                className="appointments-btn appointments-btn-secondary"
                disabled={isSubmitting}
                onClick={handleOpenCounterProposal}
              >
                Propose another time
              </button>
              <button
                type="button"
                className="appointments-btn appointments-btn-danger"
                disabled={isSubmitting}
                onClick={handleCancelClick}
              >
                Cancel appointment
              </button>
            </div>
          )}

          {canManageActive &&
            !canAcceptRescheduleRequest &&
            !awaitingRescheduleResponse && (
            <div className="appointments-card-actions">
              <button
                type="button"
                className="appointments-btn appointments-btn-secondary"
                disabled={isSubmitting}
                onClick={handleEditClick}
              >
                Request reschedule
              </button>
              <button
                type="button"
                className="appointments-btn appointments-btn-danger"
                disabled={isSubmitting}
                onClick={handleCancelClick}
              >
                Cancel
              </button>
            </div>
          )}

          {canManageActive && awaitingRescheduleResponse && (
            <div className="appointments-card-actions">
              <button
                type="button"
                className="appointments-btn appointments-btn-danger"
                disabled={isSubmitting}
                onClick={handleCancelClick}
              >
                Cancel appointment
              </button>
            </div>
          )}
        </>
      )}
    </li>
  );
}
