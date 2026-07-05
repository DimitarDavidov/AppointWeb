import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getServiceById } from "../api/services";
import type { Service } from "../types/service";
import "./ServiceDetail.scss";

function formatPrice(price: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Service not found.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadService() {
      try {
        const data = await getServiceById(id);
        if (!cancelled) {
          setService(data);
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

    loadService();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="service-detail">
        <p className="service-detail-status">Loading service...</p>
      </div>
    );
  }

  if (error || !service) {
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

  return (
    <div className="service-detail">
      <div className="service-detail-card">
        <Link to="/" className="service-detail-back">
          ← Back to services
        </Link>

        <h1 className="service-detail-title">{service.name}</h1>

        {service.description ? (
          <p className="service-detail-description">{service.description}</p>
        ) : (
          <p className="service-detail-description service-detail-description--empty">
            No description provided.
          </p>
        )}

        <dl className="service-detail-meta">
          <div className="service-detail-meta-item">
            <dt>Duration</dt>
            <dd>{formatDuration(service.durationMinutes)}</dd>
          </div>
          <div className="service-detail-meta-item">
            <dt>Price</dt>
            <dd>{formatPrice(service.price)}</dd>
          </div>
        </dl>

        <div className="service-detail-actions">
          <button type="button" className="service-detail-btn service-detail-btn-primary">
            Book appointment
          </button>
          <button type="button" className="service-detail-btn service-detail-btn-secondary">
            Choose provider
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetail;
