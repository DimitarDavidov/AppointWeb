import { Link } from "react-router-dom";
import type { CatalogOffering } from "../../types/catalog";
import { formatDuration, formatPrice } from "../../utils/formatService";

interface ProviderServicesSectionProps {
  services: CatalogOffering[];
  isLoading: boolean;
  error: string;
}

export function ProviderServicesSection({
  services,
  isLoading,
  error,
}: ProviderServicesSectionProps) {
  return (
    <section
      id="provider-panel-services"
      role="tabpanel"
      aria-labelledby="provider-tab-services"
      className="provider-tab-panel"
    >
      <p className="provider-tab-panel-intro">
        Services customers can book with you on the home page catalog.
      </p>

      {isLoading && (
        <p className="provider-status" aria-live="polite">
          Loading services...
        </p>
      )}

      {error && !isLoading && (
        <p className="provider-status provider-status--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && services.length === 0 && (
        <div className="provider-empty">
          <p className="provider-empty-text">
            No services are linked to your profile yet.
          </p>
        </div>
      )}

      {!isLoading && !error && services.length > 0 && (
        <ul className="provider-service-grid">
          {services.map((service, index) => (
            <li
              key={`${service.providerId}-${service.serviceId}`}
              className="provider-service-card"
              style={{ animationDelay: `${0.04 + index * 0.05}s` }}
            >
              {service.category && (
                <span className="provider-service-category">
                  {service.category}
                </span>
              )}
              <h3 className="provider-service-name">{service.serviceName}</h3>
              {service.description ? (
                <p className="provider-service-description">
                  {service.description}
                </p>
              ) : (
                <p className="provider-service-description provider-service-description--empty">
                  No description provided.
                </p>
              )}
              <div className="provider-service-meta">
                <span>{formatDuration(service.durationMinutes)}</span>
                <span className="provider-service-price">
                  {formatPrice(service.price)}
                </span>
              </div>
              <Link
                to={`/book/${service.providerId}/${service.serviceId}`}
                className="provider-service-link"
              >
                View booking page
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
