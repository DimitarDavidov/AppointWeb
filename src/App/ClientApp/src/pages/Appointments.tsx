import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  cancelAppointment,
  getAppointments,
  rescheduleAppointment,
} from "../api/appointments";
import { getErrorMessage } from "../api/auth";
import ConfirmDialog from "../components/ConfirmDialog/ConfirmDialog";
import { UserRoles } from "../constants/roles";
import { useAppSelector } from "../store/hooks";
import type { AppointmentDetail } from "../types/appointment";
import {
  formatAppointmentDateTime,
  toDatetimeLocalValue,
  toDatetimeLocalValueFromIso,
} from "../utils/formatAppointment";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../utils/formatService";
import "./Appointments.scss";

function getDurationMinutes(startTime: string, endTime: string): number {
  return Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60_000
  );
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "Booked":
      return "Booked";
    case "Cancelled":
      return "Cancelled";
    case "Completed":
      return "Completed";
    case "NoShow":
      return "No show";
    default:
      return status;
  }
}

function statusClassName(status: string): string {
  switch (status) {
    case "Booked":
      return "appointments-card-status--booked";
    case "Cancelled":
      return "appointments-card-status--cancelled";
    case "Completed":
      return "appointments-card-status--completed";
    case "NoShow":
      return "appointments-card-status--no-show";
    default:
      return "";
  }
}

interface AppointmentCardProps {
  appointment: AppointmentDetail;
  viewerRole: string | null;
  onUpdated: () => void;
}

function AppointmentCard({
  appointment,
  viewerRole,
  onUpdated,
}: AppointmentCardProps) {
  const durationMinutes = getDurationMinutes(
    appointment.startTime,
    appointment.endTime
  );
  const isProviderView = viewerRole === UserRoles.Provider;
  const isAdminView = viewerRole === UserRoles.Admin;
  const canModify = appointment.status === "Booked";

  const [isEditing, setIsEditing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editStartTime, setEditStartTime] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minStartTime = useMemo(() => toDatetimeLocalValue(new Date()), []);

  const counterpartName = capitalizeFirstLetter(
    isProviderView || isAdminView
      ? appointment.customerUsername
      : appointment.providerUsername
  );
  const counterpartLabel = isProviderView || isAdminView ? "Customer" : "Provider";

  function handleEditClick() {
    setEditStartTime(toDatetimeLocalValueFromIso(appointment.startTime));
    setActionError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setActionError("");
    setEditStartTime("");
  }

  function handleCancelClick() {
    setActionError("");
    setShowCancelDialog(true);
  }

  function handleCloseCancelDialog() {
    if (isSubmitting) return;
    setShowCancelDialog(false);
  }

  async function handleConfirmCancel() {
    setActionError("");
    setIsSubmitting(true);

    try {
      await cancelAppointment(appointment.id);
      setShowCancelDialog(false);
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Could not cancel this appointment. Please try again.")
      );
      setShowCancelDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();

    if (!editStartTime) return;

    setActionError("");
    setIsSubmitting(true);

    try {
      await rescheduleAppointment(appointment.id, {
        startTime: new Date(editStartTime).toISOString(),
      });
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Could not reschedule this appointment. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <li className="appointments-card">
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel appointment?"
        confirmLabel="Yes, cancel appointment"
        cancelLabel="Keep appointment"
        isConfirming={isSubmitting}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseCancelDialog}
      >
        <p>
          This will cancel your booking. You can always schedule a new appointment
          later if you change your mind.
        </p>
        <ul className="confirm-dialog-summary">
          <li>
            <span>Service</span>
            <span>{appointment.serviceName}</span>
          </li>
          <li>
            <span>{counterpartLabel}</span>
            <span>{counterpartName}</span>
          </li>
          <li>
            <span>When</span>
            <span>{formatAppointmentDateTime(appointment.startTime)}</span>
          </li>
          <li>
            <span>Price</span>
            <span>{formatPrice(appointment.priceAtBooking)}</span>
          </li>
        </ul>
      </ConfirmDialog>

      <div className="appointments-card-header">
        <div className="appointments-card-heading">
          <h2 className="appointments-card-title">{appointment.serviceName}</h2>
          <span
            className={`appointments-card-status ${statusClassName(appointment.status)}`}
          >
            {formatStatusLabel(appointment.status)}
          </span>
        </div>
      </div>

      <p className="appointments-card-description">
        {counterpartLabel} {counterpartName} · {formatDuration(durationMinutes)} ·{" "}
        {formatPrice(appointment.priceAtBooking)}
      </p>

      <dl className="appointments-card-meta">
        {!isProviderView && (
          <div className="appointments-card-meta-item">
            <dt>Provider</dt>
            <dd>{capitalizeFirstLetter(appointment.providerUsername)}</dd>
          </div>
        )}

        {(isProviderView || isAdminView) && (
          <div className="appointments-card-meta-item">
            <dt>Customer</dt>
            <dd>{capitalizeFirstLetter(appointment.customerUsername)}</dd>
          </div>
        )}

        {isAdminView && (
          <div className="appointments-card-meta-item">
            <dt>Provider</dt>
            <dd>{capitalizeFirstLetter(appointment.providerUsername)}</dd>
          </div>
        )}

        <div className="appointments-card-meta-item">
          <dt>When</dt>
          <dd>{formatAppointmentDateTime(appointment.startTime)}</dd>
        </div>

        <div className="appointments-card-meta-item">
          <dt>Duration</dt>
          <dd>{formatDuration(durationMinutes)}</dd>
        </div>
      </dl>

      {isEditing ? (
        <form className="appointments-card-edit" onSubmit={handleSaveEdit}>
          <label className="appointments-card-edit-field" htmlFor={`edit-${appointment.id}`}>
            New date and time
            <input
              id={`edit-${appointment.id}`}
              type="datetime-local"
              value={editStartTime}
              min={minStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>

          {actionError && (
            <p className="appointments-card-action-error" role="alert">
              {actionError}
            </p>
          )}

          <div className="appointments-card-actions">
            <button
              type="submit"
              className="appointments-btn appointments-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="appointments-btn appointments-btn-secondary"
              disabled={isSubmitting}
              onClick={handleCancelEdit}
            >
              Cancel edit
            </button>
          </div>
        </form>
      ) : (
        <>
          {actionError && (
            <p className="appointments-card-action-error" role="alert">
              {actionError}
            </p>
          )}

          {canModify && (
            <div className="appointments-card-actions">
              <button
                type="button"
                className="appointments-btn appointments-btn-secondary"
                disabled={isSubmitting}
                onClick={handleEditClick}
              >
                Edit
              </button>
              <button
                type="button"
                className="appointments-btn appointments-btn-danger"
                disabled={isSubmitting}
                onClick={handleCancelClick}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </li>
  );
}

function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, role } = useAppSelector((state) => state.auth);

  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
    }
  }, [accessToken, location.pathname, navigate]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function loadAppointments() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await getAppointments();
        if (!cancelled) {
          setAppointments(data);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            getErrorMessage(err, "Could not load appointments. Please try again.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey]);

  function handleAppointmentUpdated() {
    setReloadKey((key) => key + 1);
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="appointments">
      <div className="appointments-inner">
        <header className="appointments-header">
          <h1 className="appointments-title">Appointments</h1>
          <p className="appointments-subtitle">
            View and manage your upcoming and past bookings.
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
                viewerRole={role}
                onUpdated={handleAppointmentUpdated}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Appointments;
