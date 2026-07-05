import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCatalogOffering } from "../api/catalog";
import type { CatalogOffering } from "../types/catalog";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatDuration, formatPrice } from "../utils/formatService";
import "./ServiceDetail.scss";

function ServiceDetail() {
  const { providerId, serviceId } = useParams<{
    providerId: string;
    serviceId: string;
  }>();
  const [offering, setOffering] = useState<CatalogOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!providerId || !serviceId) {
      setError("Service not found.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOffering() {
      try {
        const data = await getCatalogOffering(providerId, serviceId);
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

        <div className="service-detail-actions">
          <button type="button" className="service-detail-btn service-detail-btn-primary">
            Book appointment
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetail;
