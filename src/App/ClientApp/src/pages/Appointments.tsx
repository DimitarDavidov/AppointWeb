import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAppointments } from "../api/appointments";
import { AppointmentCard } from "../components/Appointments/AppointmentCard";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  APPOINTMENT_FILTERS,
  filterAppointmentsByStatus,
  getAppointmentFilterEmptyMessage,
  type AppointmentFilter,
} from "../utils/appointmentFilters";
import "./Appointments.scss";

function Appointments() {
  const [activeFilter, setActiveFilter] = useState<AppointmentFilter>("upcoming");
  const {
    data: appointments = [],
    isLoading,
    error: loadError,
    reload,
  } = useAsyncData(getAppointments, [], {
    initialData: [],
    errorMessage: "Could not load appointments. Please try again.",
  });

  const filteredAppointments = useMemo(
    () => filterAppointmentsByStatus(appointments, activeFilter),
    [appointments, activeFilter]
  );

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

        {!isLoading && !loadError && (
          <>
            <div
              className="appointments-filters"
              role="tablist"
              aria-label="Appointment filters"
            >
              {APPOINTMENT_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter.id}
                  className={`appointments-filter${
                    activeFilter === filter.id ? " appointments-filter--active" : ""
                  }`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {appointments.length === 0 && (
              <div className="appointments-empty">
                <p className="appointments-empty-text">No appointments yet.</p>
                <Link to="/" className="appointments-btn appointments-btn-primary">
                  Browse services
                </Link>
              </div>
            )}

            {appointments.length > 0 && filteredAppointments.length === 0 && (
              <div className="appointments-empty">
                <p className="appointments-empty-text">
                  {getAppointmentFilterEmptyMessage(activeFilter)}
                </p>
                {activeFilter === "upcoming" && (
                  <Link to="/" className="appointments-btn appointments-btn-primary">
                    Browse services
                  </Link>
                )}
              </div>
            )}

            {filteredAppointments.length > 0 && (
              <ul className="appointments-list">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onUpdated={reload}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Appointments;
