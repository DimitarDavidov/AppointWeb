import { SpinnerIcon } from "../Account/AccountIcons";
import { ProviderEmptyAppointmentsIcon } from "./ProviderIcons";
import { ProviderPastAppointmentItem } from "./ProviderPastAppointmentItem";
import type { AppointmentDetail } from "../../types/appointment";

interface ProviderCancelledAppointmentsSectionProps {
  cancelledAppointments: AppointmentDetail[];
  isLoading: boolean;
  error: string;
}

export function ProviderCancelledAppointmentsSection({
  cancelledAppointments,
  isLoading,
  error,
}: ProviderCancelledAppointmentsSectionProps) {
  const hasCancelled = cancelledAppointments.length > 0;

  return (
    <section
      id="provider-panel-cancelled"
      role="tabpanel"
      aria-labelledby="provider-tab-cancelled"
      className="provider-tab-panel"
    >
      <div className="provider-tab-panel-intro">
        <p>
          Cancelled bookings appear here for your records. View appointment
          details and any cancellation reason that was provided.
        </p>
      </div>

      {isLoading && (
        <div className="provider-loading provider-loading--inline" aria-live="polite">
          <SpinnerIcon className="provider-loading-spinner" />
          <p>Loading appointments...</p>
        </div>
      )}

      {error && !isLoading && (
        <p className="provider-status provider-status--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && !hasCancelled && (
        <div className="provider-empty">
          <ProviderEmptyAppointmentsIcon className="provider-empty-icon" />
          <p className="provider-empty-title">No cancelled appointments</p>
          <p className="provider-empty-text">
            When a booking is cancelled, it will appear here for your records.
          </p>
        </div>
      )}

      {!isLoading && !error && hasCancelled && (
        <ul className="provider-appointment-list">
          {cancelledAppointments.map((appointment, index) => (
            <ProviderPastAppointmentItem
              key={appointment.id}
              appointment={appointment}
              index={index}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
