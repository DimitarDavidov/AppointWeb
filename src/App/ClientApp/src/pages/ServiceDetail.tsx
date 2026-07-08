import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createAppointment } from "../api/appointments";
import { getErrorMessage } from "../api/errors";
import { getCatalogOffering } from "../api/catalog";
import { AppointmentBookingPicker } from "../components/Calendar/AppointmentBookingPicker";
import type { Appointment } from "../types/appointment";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAppSelector } from "../store/hooks";
import { formatAppointmentDateTime } from "../utils/formatAppointment";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatDuration, formatPrice, formatServiceLocation } from "../utils/formatService";
import { isSameId } from "../utils/isSameId";
import { UserRoles } from "../constants/roles";
import "./ServiceDetail.scss";

function ServiceDetail() {
  const { providerId, serviceId } = useParams<{
    providerId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, userId, role } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!accessToken;
  const isOwnService = isLoggedIn && isSameId(userId, providerId);
  const canManageOwnService =
    isOwnService &&
    (role === UserRoles.Provider || role === UserRoles.Admin);
  const missingParams = !providerId || !serviceId;
  const {
    data: offering,
    isLoading,
    error: fetchError,
  } = useAsyncData(
    () => getCatalogOffering(providerId!, serviceId!),
    [providerId, serviceId],
    {
      enabled: !missingParams,
      errorMessage: "Service not found or unavailable.",
    }
  );
  const error = missingParams ? "Service not found." : fetchError;
  const [showBooking, setShowBooking] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<Appointment | null>(null);

  function handleBookClick() {
    if (isOwnService) return;

    if (!isLoggedIn) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setBookingError("");
    setStartTime(null);
    setShowBooking(true);
  }

  async function handleBookingSubmit(e: FormEvent) {
    e.preventDefault();

    if (!offering || !providerId || !serviceId || !startTime || isOwnService) return;

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
    const isPending = confirmedAppointment.status === "Pending";

    return (
      <div className="service-detail">
        <div className="service-detail-card service-detail-card--message">
          <p className="service-detail-success-title">
            {isPending ? "Appointment request sent" : "Appointment booked"}
          </p>
          <p className="service-detail-success-text">
            {isPending ? (
              <>
                Your request for {offering.serviceName} with{" "}
                {capitalizeFirstLetter(offering.providerUsername)} on{" "}
                {formatAppointmentDateTime(confirmedAppointment.startTime)} is
                pending. The provider will confirm your appointment soon.
              </>
            ) : (
              <>
                Your {offering.serviceName} with{" "}
                {capitalizeFirstLetter(offering.providerUsername)} is confirmed for{" "}
                {formatAppointmentDateTime(confirmedAppointment.startTime)}.
              </>
            )}
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

        <p className="service-detail-location">
          {formatServiceLocation(offering.city, offering.country, offering.isRemote)}
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
            <dt>Location</dt>
            <dd>{formatServiceLocation(offering.city, offering.country, offering.isRemote)}</dd>
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

        {isOwnService ? (
          <div className="service-detail-own-service">
            <p className="service-detail-own-service-text">
              This is your service. You cannot book appointments for your own
              offerings.
            </p>
            {canManageOwnService && (
              <Link
                to="/provider"
                className="service-detail-btn service-detail-btn-primary"
              >
                Manage in provider panel
              </Link>
            )}
          </div>
        ) : showBooking ? (
          <form
            className="service-detail-booking"
            onSubmit={handleBookingSubmit}
          >
            <h2 className="service-detail-booking-title">Choose a time</h2>
            <p className="service-detail-booking-hint">
              Pick a date, then select an available slot for your{" "}
              {formatDuration(offering.durationMinutes)} appointment.
            </p>

            <AppointmentBookingPicker
              providerId={providerId!}
              serviceId={serviceId!}
              durationMinutes={offering.durationMinutes}
              selectedStart={startTime}
              onSelect={setStartTime}
            />

            {bookingError && (
              <p className="service-detail-booking-error" role="alert">
                {bookingError}
              </p>
            )}

            <div className="service-detail-actions service-detail-actions--booking">
              <button
                type="submit"
                className="service-detail-btn service-detail-btn-primary"
                disabled={isSubmitting || !startTime}
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
                  setStartTime(null);
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
