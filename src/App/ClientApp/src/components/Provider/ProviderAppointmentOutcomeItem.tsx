import { useState } from "react";
import { updateAppointmentStatus } from "../../api/appointments";
import type { AppointmentDetail } from "../../types/appointment";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "../../utils/providerPanelUtils";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { formatPrice } from "../../utils/formatService";
import {
  ProviderCalendarIcon,
  ProviderCustomerIcon,
} from "./ProviderIcons";
import { AppointmentOutcomeActions } from "../Appointments/AppointmentOutcomeActions";
interface ProviderAppointmentOutcomeItemProps {
  appointment: AppointmentDetail;
  index: number;
  onUpdated: () => void;
}

export function ProviderAppointmentOutcomeItem({
  appointment,
  index,
  onUpdated,
}: ProviderAppointmentOutcomeItemProps) {
  const customerName = capitalizeFirstLetter(appointment.customerUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSetStatus(status: "Completed" | "NoShow") {
    setIsSubmitting(true);

    try {
      await updateAppointmentStatus(appointment.id, status);
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <li
      className="provider-appointment-item provider-appointment-item--outcome"
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
      <div className="provider-appointment-row">
        <div className="provider-appointment-main">
          <div className="provider-appointment-heading">
            <div className="provider-appointment-heading-text">
              <div className="provider-appointment-title-row">
                <h3 className="provider-appointment-title">
                  {appointment.serviceName}
                </h3>
                <span className="provider-appointment-status provider-appointment-status--outcome">
                  Needs update
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
                When
              </dt>
              <dd>
                {formatAppointmentDate(appointment.startTime)} at{" "}
                {formatAppointmentTime(appointment.startTime)}
              </dd>
            </div>
          </dl>
        </div>

        <AppointmentOutcomeActions
          viewer="provider"
          isSubmitting={isSubmitting}
          buttonClassPrefix="provider"
          className="provider-appointment-outcome-panel"
          onSubmit={handleSetStatus}
        />
      </div>
    </li>
  );
}
