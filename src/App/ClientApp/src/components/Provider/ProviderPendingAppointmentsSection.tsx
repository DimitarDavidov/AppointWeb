import { SpinnerIcon } from "../Account/AccountIcons";
import { ProviderUpcomingAppointmentItem } from "./ProviderUpcomingAppointmentItem";
import { ProviderEmptyAppointmentsIcon } from "./ProviderIcons";
import type { AppointmentDetail } from "../../types/appointment";

interface ProviderPendingAppointmentsSectionProps {
  pendingAppointments: AppointmentDetail[];
  isLoading: boolean;
  error: string;
  onUpdated: () => void;
}

export function ProviderPendingAppointmentsSection({
  pendingAppointments,
  isLoading,
  error,
  onUpdated,
}: ProviderPendingAppointmentsSectionProps) {
  const hasPending = pendingAppointments.length > 0;

  return (
    <section
      id="provider-panel-pending"
      role="tabpanel"
      aria-labelledby="provider-tab-pending"
      className="provider-tab-panel"
    >
      <div className="provider-tab-panel-intro">
        <p>
          Review booking requests and reschedule proposals waiting for your
          confirmation.
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

      {!isLoading && !error && !hasPending && (
        <div className="provider-empty">
          <ProviderEmptyAppointmentsIcon className="provider-empty-icon" />
          <p className="provider-empty-title">No pending appointments</p>
          <p className="provider-empty-text">
            New booking requests and reschedule proposals will appear here until
            you confirm them.
          </p>
        </div>
      )}

      {!isLoading && !error && hasPending && (
        <ul className="provider-appointment-list">
          {pendingAppointments.map((appointment, index) => (
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
