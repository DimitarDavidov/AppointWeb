import { SpinnerIcon } from "../Account/AccountIcons";
import { ProviderUpcomingAppointmentItem } from "./ProviderUpcomingAppointmentItem";
import { ProviderEmptyAppointmentsIcon } from "./ProviderIcons";
import type { AppointmentDetail } from "../../types/appointment";

interface ProviderAppointmentsSectionProps {
  upcomingAppointments: AppointmentDetail[];
  isLoading: boolean;
  error: string;
  onUpdated: () => void;
}

export function ProviderAppointmentsSection({
  upcomingAppointments,
  isLoading,
  error,
  onUpdated,
}: ProviderAppointmentsSectionProps) {
  return (
    <section
      id="provider-panel-appointments"
      role="tabpanel"
      aria-labelledby="provider-tab-appointments"
      className="provider-tab-panel"
    >
      <div className="provider-tab-panel-intro">
        <p>
          Review booking requests, confirm appointments, cancel when needed, or
          request a new time for your customers.
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

      {!isLoading && !error && upcomingAppointments.length === 0 && (
        <div className="provider-empty">
          <ProviderEmptyAppointmentsIcon className="provider-empty-icon" />
          <p className="provider-empty-title">No upcoming appointments</p>
          <p className="provider-empty-text">
            When customers request a booking with you, it will appear here for
            confirmation.
          </p>
        </div>
      )}

      {!isLoading && !error && upcomingAppointments.length > 0 && (
        <ul className="provider-appointment-list">
          {upcomingAppointments.map((appointment, index) => (
            <ProviderUpcomingAppointmentItem
              key={appointment.id}
              appointment={appointment}
              index={index}
              onUpdated={onUpdated}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
