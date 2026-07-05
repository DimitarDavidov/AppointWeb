import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createAppointment } from "../api/appointments";
import { getErrorMessage } from "../api/auth";
import { getCatalogOffering } from "../api/catalog";
import type { Appointment } from "../types/appointment";
import type { CatalogOffering } from "../types/catalog";
import { useAppSelector } from "../store/hooks";
import {
  formatAppointmentDateTime,
  toDatetimeLocalValue,
} from "../utils/formatAppointment";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../utils/formatService";
import "./ServiceDetail.scss";

function ServiceDetail() {
  const { providerId, serviceId } = useParams<{
    providerId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!useAppSelector((state) => state.auth.accessToken);

  const [offering, setOffering] = useState<CatalogOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<Appointment | null>(null);

  const minStartTime = useMemo(() => toDatetimeLocalValue(new Date()), []);

  useEffect(() => {
    if (!providerId || !serviceId) {
      setError("Service not found.");
      setIsLoading(false);
      return;
    }

    const pid = providerId;
    const sid = serviceId;
    let cancelled = false;

    async function loadOffering() {
      try {
        const data = await getCatalogOffering(pid, sid);
        if (!cancelled) {
          setOffering(data);
        }
      } catch {
        if (!cancelled) {
          setError("Service not found or unavailable.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadOffering();

    return () => {
      cancelled = true;
    };
  }, [providerId, serviceId]);

  function handleBookClick() {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setBookingError("");
    setShowBooking(true);
  }

  async function handleBookingSubmit(e: FormEvent) {
    e.preventDefault();

    if (!offering || !providerId || !serviceId || !startTime) return;

    setBookingError("");
    setIsSubmitting(true);

    try {
      const appointment = await createAppointment({
        providerId,
        serviceId,
        startTime: new Date(startTime).toISOString(),
      });
      setConfirmedAppointment(appointment);
      setShowBooking(false);
    } catch (err) {
      setBookingError(
        getErrorMessage(err, "Could not book this appointment. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="service-detail">
        <p className="service-detail-status">Loading service...</p>
      </div>
    );
  }

  if (error || !offering) {
    return (
      <div className="service-detail">
        <div className="service-detail-card service-detail-card--message">
          <p className="service-detail-status service-detail-status--error">
            {error || "Service not found."}
          </p>
          <Link to="/" className="service-detail-btn service-detail-btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (confirmedAppointment) {
    return (
      <div className="service-detail">
        <div className="service-detail-card service-detail-card--message">
          <p className="service-detail-success-title">Appointment booked</p>
          <p className="service-detail-success-text">
            Your {offering.serviceName} with{" "}
            {capitalizeFirstLetter(offering.providerUsername)} is confirmed for{" "}
            {formatAppointmentDateTime(confirmedAppointment.startTime)}.
          </p>
          <p className="service-detail-success-meta">
            {formatDuration(offering.durationMinutes)} ·{" "}
            {formatPrice(confirmedAppointment.priceAtBooking)}
          </p>
          <div className="service-detail-actions service-detail-actions--centered">
            <Link to="/" className="service-detail-btn service-detail-btn-primary">
              Back to services
            </Link>
            <Link
              to="/appointments"
              className="service-detail-btn service-detail-btn-secondary"
            >
              View appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-detail">
      <div className="service-detail-card">
        <Link to="/" className="service-detail-back">
          ← Back to services
        </Link>

        {offering.category && (
          <span className="service-detail-category">{offering.category}</span>
        )}

        <h1 className="service-detail-title">{offering.serviceName}</h1>

        <p className="service-detail-provider">
          with{" "}
          <strong>{capitalizeFirstLetter(offering.providerUsername)}</strong>
        </p>

        {offering.description ? (
          <p className="service-detail-description">{offering.description}</p>
        ) : (
          <p className="service-detail-description service-detail-description--empty">
            No description provided.
          </p>
        )}

        <dl className="service-detail-meta">
          <div className="service-detail-meta-item">
            <dt>Provider</dt>
            <dd>{capitalizeFirstLetter(offering.providerUsername)}</dd>
          </div>
          <div className="service-detail-meta-item">
            <dt>Duration</dt>
            <dd>{formatDuration(offering.durationMinutes)}</dd>
          </div>
          <div className="service-detail-meta-item">
            <dt>Price</dt>
            <dd>{formatPrice(offering.price)}</dd>
          </div>
        </dl>

        {showBooking ? (
          <form
            className="service-detail-booking"
            onSubmit={handleBookingSubmit}
          >
            <h2 className="service-detail-booking-title">Choose a time</h2>
            <p className="service-detail-booking-hint">
              Pick when you would like your {formatDuration(offering.durationMinutes)}{" "}
              appointment to start.
            </p>

            <label className="service-detail-booking-field" htmlFor="start-time">
              Date and time
              <input
                id="start-time"
                type="datetime-local"
                value={startTime}
                min={minStartTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>

            {bookingError && (
              <p className="service-detail-booking-error" role="alert">
                {bookingError}
              </p>
            )}

            <div className="service-detail-actions">
              <button
                type="submit"
                className="service-detail-btn service-detail-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Booking..." : "Confirm booking"}
              </button>
              <button
                type="button"
                className="service-detail-btn service-detail-btn-secondary"
                disabled={isSubmitting}
                onClick={() => {
                  setShowBooking(false);
                  setBookingError("");
                  setStartTime("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="service-detail-actions">
            <button
              type="button"
              className="service-detail-btn service-detail-btn-primary"
              onClick={handleBookClick}
            >
              Book appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceDetail;
