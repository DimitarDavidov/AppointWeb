import { Link } from "react-router-dom";
import { EditActionIcon } from "../Admin/AdminActionIcons";
import type { ProviderServiceDetail } from "../../types/provider";
import {
  formatDuration,
  formatPriceAmount,
  formatServiceLocation,
} from "../../utils/formatService";
import {
  ProviderClockIcon,
  ProviderExternalLinkIcon,
  ProviderPriceIcon,
  ProviderRescheduleIcon,
  ProviderServiceIcon,
} from "./ProviderIcons";

interface ProviderServiceCardProps {
  service: ProviderServiceDetail;
  providerId: string;
  index: number;
  onEdit: (service: ProviderServiceDetail) => void;
  onManageAvailability: (service: ProviderServiceDetail) => void;
}

export function ProviderServiceCard({
  service,
  providerId,
  index,
  onEdit,
  onManageAvailability,
}: ProviderServiceCardProps) {
  return (
    <li
      className="provider-service-card"
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
      <div className="provider-service-card-header">
        <span className="provider-service-card-icon" aria-hidden="true">
          <ProviderServiceIcon />
        </span>
        <div className="provider-service-card-heading">
          {service.category && (
            <span className="provider-service-category">{service.category}</span>
          )}
          <h3 className="provider-service-name">{service.serviceName}</h3>
        </div>
      </div>

      {service.description ? (
        <p className="provider-service-description">{service.description}</p>
      ) : (
        <p className="provider-service-description provider-service-description--empty">
          No description yet — add one so customers know what to expect.
        </p>
      )}

      <div className="provider-service-meta">
        <span className="provider-service-meta-item">
          {formatServiceLocation(service.city, service.country, service.isRemote)}
        </span>
        <span className="provider-service-meta-item">
          <ProviderClockIcon />
          {formatDuration(service.durationMinutes)}
        </span>
        <span className="provider-service-meta-item provider-service-meta-item--price">
          <ProviderPriceIcon />
          {formatPriceAmount(service.price)}
        </span>
      </div>

      <div className="provider-service-card-footer">
        <button
          type="button"
          className="provider-btn provider-btn--secondary provider-service-card-action-btn"
          onClick={() => onEdit(service)}
        >
          <EditActionIcon className="provider-btn-icon" />
          Edit
        </button>
        <button
          type="button"
          className="provider-btn provider-btn--secondary provider-service-card-action-btn provider-service-card-action-btn--accent"
          onClick={() => onManageAvailability(service)}
        >
          <ProviderRescheduleIcon className="provider-btn-icon" />
          Hours
        </button>
        <Link
          to={`/book/${providerId}/${service.serviceId}`}
          className="provider-btn provider-btn--secondary provider-service-card-action-btn provider-service-card-preview-btn"
        >
          Preview
          <ProviderExternalLinkIcon className="provider-btn-icon" />
        </Link>
      </div>
    </li>
  );
}
