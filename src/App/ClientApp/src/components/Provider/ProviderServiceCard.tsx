import { Link } from "react-router-dom";
import { EditActionIcon } from "../Admin/AdminActionIcons";
import type { ProviderServiceDetail, ProviderServiceEditFocus } from "../../types/provider";
import { formatDuration, formatPrice } from "../../utils/formatService";
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
  onEdit: (service: ProviderServiceDetail, focus: ProviderServiceEditFocus) => void;
  onManageAvailability: () => void;
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
          No description provided.
        </p>
      )}

      <div className="provider-service-meta">
        <span className="provider-service-meta-item">
          <ProviderClockIcon />
          {formatDuration(service.durationMinutes)}
        </span>
        <span className="provider-service-meta-item provider-service-meta-item--price">
          <ProviderPriceIcon />
          {formatPrice(service.price)}
        </span>
      </div>

      <div className="provider-service-actions">
        <button
          type="button"
          className="provider-service-action"
          onClick={() => onEdit(service, "title")}
        >
          <EditActionIcon />
          Edit title
        </button>
        <button
          type="button"
          className="provider-service-action"
          onClick={() => onEdit(service, "description")}
        >
          <EditActionIcon />
          Edit description
        </button>
        <button
          type="button"
          className="provider-service-action"
          onClick={() => onEdit(service, "price")}
        >
          <ProviderPriceIcon />
          Edit price
        </button>
        <button
          type="button"
          className="provider-service-action"
          onClick={() => onEdit(service, "duration")}
        >
          <ProviderClockIcon />
          Edit duration
        </button>
        <button
          type="button"
          className="provider-service-action provider-service-action--accent"
          onClick={onManageAvailability}
        >
          <ProviderRescheduleIcon />
          Availability
        </button>
      </div>

      <Link
        to={`/book/${providerId}/${service.serviceId}`}
        className="provider-service-link"
      >
        Preview listing
        <ProviderExternalLinkIcon className="provider-service-link-icon" />
      </Link>
    </li>
  );
}
