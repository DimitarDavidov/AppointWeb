import { Link } from "react-router-dom";
import { getAppointments } from "../api/appointments";
import { AppointmentCard } from "../components/Appointments/AppointmentCard";
import { useAsyncData } from "../hooks/useAsyncData";
import "./Appointments.scss";

function Appointments() {
  const {
    data: appointments = [],
    isLoading,
    error: loadError,
    reload,
  } = useAsyncData(getAppointments, [], {
    initialData: [],
    errorMessage: "Could not load appointments. Please try again.",
  });

  return (
    <div className="appointments">
      <div className="appointments-inner">
        <header className="appointments-header">
          <h1 className="appointments-title">Appointments</h1>
          <p className="appointments-subtitle">
            View and manage appointments you booked with providers.
          </p>
        </header>

        {isLoading && (
          <p className="appointments-status" aria-live="polite">
            Loading appointments...
          </p>
        )}

        {loadError && (
          <p className="appointments-status appointments-status--error" role="alert">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && appointments.length === 0 && (
          <div className="appointments-empty">
            <p className="appointments-empty-text">No appointments yet.</p>
            <Link to="/" className="appointments-btn appointments-btn-primary">
              Browse services
            </Link>
          </div>
        )}

        {!isLoading && !loadError && appointments.length > 0 && (
          <ul className="appointments-list">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onUpdated={reload}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Appointments;
