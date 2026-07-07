import { ProviderUpcomingAppointmentItem } from "./ProviderUpcomingAppointmentItem";
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
      <p className="provider-tab-panel-intro">
        Manage upcoming bookings from customers.
      </p>

      {isLoading && (
        <p className="provider-status" aria-live="polite">
          Loading appointments...
        </p>
      )}

      {error && !isLoading && (
        <p className="provider-status provider-status--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && upcomingAppointments.length === 0 && (
        <div className="provider-empty">
          <p className="provider-empty-text">No upcoming appointments.</p>
        </div>
      )}

      {!isLoading && !error && upcomingAppointments.length > 0 && (
        <ul className="provider-appointment-list">
          {upcomingAppointments.map((appointment) => (
            <ProviderUpcomingAppointmentItem
              key={appointment.id}
              appointment={appointment}
              onUpdated={onUpdated}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
