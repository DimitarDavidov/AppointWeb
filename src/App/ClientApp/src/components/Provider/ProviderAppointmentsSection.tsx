import { SpinnerIcon } from "../Account/AccountIcons";
import { ProviderAppointmentOutcomeItem } from "./ProviderAppointmentOutcomeItem";
import { ProviderUpcomingAppointmentItem } from "./ProviderUpcomingAppointmentItem";
import { ProviderEmptyAppointmentsIcon } from "./ProviderIcons";
import type { AppointmentDetail } from "../../types/appointment";

interface ProviderAppointmentsSectionProps {
  upcomingAppointments: AppointmentDetail[];
  outcomeAppointments: AppointmentDetail[];
  isLoading: boolean;
  error: string;
  onUpdated: () => void;
}

export function ProviderAppointmentsSection({
  upcomingAppointments,
  outcomeAppointments,
  isLoading,
  error,
  onUpdated,
}: ProviderAppointmentsSectionProps) {
  const hasUpcoming = upcomingAppointments.length > 0;
  const hasOutcome = outcomeAppointments.length > 0;

  return (
    <section
      id="provider-panel-appointments"
      role="tabpanel"
      aria-labelledby="provider-tab-appointments"
      className="provider-tab-panel"
    >
      <div className="provider-tab-panel-intro">
        <p>
          Review booking requests, confirm appointments, cancel when needed,
          request a new time, or update the status after an appointment has
          finished.
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

      {!isLoading && !error && hasOutcome && (
        <>
          <h2 className="provider-appointment-section-title">
            Update appointment status
          </h2>
          <p className="provider-appointment-section-copy">
            These confirmed appointments have finished. Mark whether the customer
            attended.
          </p>
          <ul className="provider-appointment-list provider-appointment-list--outcome">
            {outcomeAppointments.map((appointment, index) => (
              <ProviderAppointmentOutcomeItem
                key={appointment.id}
                appointment={appointment}
                index={index}
                onUpdated={onUpdated}
              />
            ))}
          </ul>
        </>
      )}

      {!isLoading && !error && !hasUpcoming && !hasOutcome && (
        <div className="provider-empty">
          <ProviderEmptyAppointmentsIcon className="provider-empty-icon" />
          <p className="provider-empty-title">No upcoming appointments</p>
          <p className="provider-empty-text">
            When customers request a booking with you, it will appear here for
            confirmation.
          </p>
        </div>
      )}

      {!isLoading && !error && hasUpcoming && (
        <>
          {hasOutcome && (
            <h2 className="provider-appointment-section-title">
              Upcoming appointments
            </h2>
          )}
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
        </>
      )}
    </section>
  );
}
