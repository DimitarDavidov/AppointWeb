import { useState } from "react";
import { updateAppointmentStatus } from "../../api/appointments";
import type { AppointmentDetail } from "../../types/appointment";
import {
  getOutcomeStatusLabel,
  needsAppointmentOutcome,
} from "../../utils/appointmentOutcomeUtils";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../../utils/formatService";
import { formatAppointmentDateTime } from "../../utils/formatAppointment";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "../../utils/providerPanelUtils";
import { AppointmentOutcomeActions } from "../Appointments/AppointmentOutcomeActions";
import { AppointmentRescheduleMeta } from "../Appointments/AppointmentRescheduleMeta";
import {
  ProviderCalendarIcon,
  ProviderClockIcon,
  ProviderCustomerIcon,
  ProviderDurationIcon,
  ProviderPriceIcon,
  ProviderStatBookedIcon,
} from "./ProviderIcons";

function getDurationMinutes(startTime: string, endTime: string): number {
  return Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60_000
  );
}

function getPastStatusLabel(status: string): string {
  if (status === "Completed" || status === "NoShow") {
    return getOutcomeStatusLabel(status, "provider");
  }

  if (status === "Cancelled") {
    return "Cancelled";
  }

  return status;
}

function getPastStatusClassName(status: string): string {
  switch (status) {
    case "Completed":
      return "provider-appointment-status--completed";
    case "NoShow":
      return "provider-appointment-status--no-show";
    case "Cancelled":
      return "provider-appointment-status--cancelled";
    default:
      return "provider-appointment-status--outcome";
  }
}

interface ProviderPastAppointmentItemProps {
  appointment: AppointmentDetail;
  index: number;
  onUpdated?: () => void;
}

export function ProviderPastAppointmentItem({
  appointment,
  index,
  onUpdated,
}: ProviderPastAppointmentItemProps) {
  const durationMinutes = getDurationMinutes(
    appointment.startTime,
    appointment.endTime
  );
  const customerName = capitalizeFirstLetter(appointment.customerUsername);
  const serviceInitial = appointment.serviceName.charAt(0).toUpperCase();
  const needsOutcome = needsAppointmentOutcome(appointment);
  const statusLabel = needsOutcome
    ? "Needs update"
    : getPastStatusLabel(appointment.status);
  const statusClassName = getPastStatusClassName(appointment.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSetStatus(status: "Completed" | "NoShow") {
    setIsSubmitting(true);

    try {
      await updateAppointmentStatus(appointment.id, status);
      onUpdated?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <li
      className={`provider-appointment-item provider-appointment-item--past${
        needsOutcome ? " provider-appointment-item--outcome" : ""
      }`}
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
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
                  className={`provider-appointment-status ${statusClassName}`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="provider-appointment-subtitle">
                With {customerName} · {formatPrice(appointment.priceAtBooking)}
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
            <div className="provider-appointment-meta-item">
              <dt>
                <ProviderStatBookedIcon />
                Created
              </dt>
              <dd>{formatAppointmentDateTime(appointment.createdAt)}</dd>
            </div>
            <AppointmentRescheduleMeta appointment={appointment} />
          </dl>

          {appointment.status === "Cancelled" &&
            appointment.cancellationReason && (
              <p className="provider-appointment-cancellation-reason">
                <span>Cancellation reason</span>
                {appointment.cancellationReason}
              </p>
            )}
        </div>

        {needsOutcome && (
          <AppointmentOutcomeActions
            viewer="provider"
            isSubmitting={isSubmitting}
            buttonClassPrefix="provider"
            className="provider-appointment-outcome-panel"
            onSubmit={handleSetStatus}
          />
        )}
      </div>
    </li>
  );
}
