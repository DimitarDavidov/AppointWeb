import { SpinnerIcon } from "../Account/AccountIcons";
import { ProviderEmptyAppointmentsIcon } from "./ProviderIcons";
import { ProviderPastAppointmentItem } from "./ProviderPastAppointmentItem";
import type { AppointmentDetail } from "../../types/appointment";

interface ProviderPastAppointmentsSectionProps {
  pastAppointments: AppointmentDetail[];
  isLoading: boolean;
  error: string;
  onUpdated: () => void;
}

export function ProviderPastAppointmentsSection({
  pastAppointments,
  isLoading,
  error,
  onUpdated,
}: ProviderPastAppointmentsSectionProps) {
  const hasPast = pastAppointments.length > 0;

  return (
    <section
      id="provider-panel-past"
      role="tabpanel"
      aria-labelledby="provider-tab-past"
      className="provider-tab-panel"
    >
      <div className="provider-tab-panel-intro">
        <p>
          Finished appointments appear here after their scheduled time. Mark
          whether the customer attended or was a no-show, and review completed
          bookings.
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

      {!isLoading && !error && !hasPast && (
        <div className="provider-empty">
          <ProviderEmptyAppointmentsIcon className="provider-empty-icon" />
          <p className="provider-empty-title">No past appointments</p>
          <p className="provider-empty-text">
            Finished appointments will appear here. Mark whether they took place
            once the scheduled time has passed.
          </p>
        </div>
      )}

      {!isLoading && !error && hasPast && (
        <ul className="provider-appointment-list">
          {pastAppointments.map((appointment, index) => (
            <ProviderPastAppointmentItem
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
