import { useState } from "react";
import { Link } from "react-router-dom";
import { EditActionIcon, DeleteActionIcon, SuspendActionIcon, UnsuspendActionIcon } from "../Admin/AdminActionIcons";
import type { ProviderServiceDetail } from "../../types/provider";
import type { ProviderServiceStats } from "../../utils/providerPanelUtils";
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
import { ProviderServiceStatsPanel } from "./ProviderServiceStatsPanel";

interface ProviderServiceCardProps {
  service: ProviderServiceDetail;
  providerId: string;
  index: number;
  stats: ProviderServiceStats;
  onEdit: (service: ProviderServiceDetail) => void;
  onManageAvailability: (service: ProviderServiceDetail) => void;
  onDeactivate: (service: ProviderServiceDetail) => void;
  onReactivate: (service: ProviderServiceDetail) => void;
  onDelete: (service: ProviderServiceDetail) => void;
  isReactivating?: boolean;
}

export function ProviderServiceCard({
  service,
  providerId,
  index,
  stats,
  onEdit,
  onManageAvailability,
  onDeactivate,
  onReactivate,
  onDelete,
  isReactivating = false,
}: ProviderServiceCardProps) {
  const [showStats, setShowStats] = useState(false);
  const statsToggleId = `provider-service-stats-${service.serviceId}`;
  const isActive = service.isActive ?? true;

  return (
    <li
      className={`provider-service-card${
        isActive ? "" : " provider-service-card--inactive"
      }`}
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
          <div className="provider-service-name-row">
            <h3 className="provider-service-name">{service.serviceName}</h3>
            {!isActive && (
              <span className="provider-service-status-badge">Inactive</span>
            )}
          </div>
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

      <button
        type="button"
        className={`provider-service-stats-toggle${
          showStats ? " provider-service-stats-toggle--open" : ""
        }`}
        aria-expanded={showStats}
        aria-controls={statsToggleId}
        onClick={() => setShowStats((open) => !open)}
      >
        <span>{showStats ? "Hide performance" : "View performance"}</span>
        <span className="provider-service-stats-toggle-icon" aria-hidden="true" />
      </button>

      {showStats && (
        <div id={statsToggleId}>
          <ProviderServiceStatsPanel stats={stats} />
        </div>
      )}

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
        {isActive ? (
          <Link
            to={`/book/${providerId}/${service.serviceId}`}
            className="provider-btn provider-btn--secondary provider-service-card-action-btn provider-service-card-preview-btn"
          >
            Preview
            <ProviderExternalLinkIcon className="provider-btn-icon" />
          </Link>
        ) : (
          <span
            className="provider-service-card-preview-placeholder"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="provider-service-card-danger-actions">
        {isActive ? (
          <button
            type="button"
            className="provider-btn provider-btn--secondary provider-service-card-action-btn provider-service-card-action-btn--warning"
            onClick={() => onDeactivate(service)}
          >
            <SuspendActionIcon className="provider-btn-icon" />
            Make inactive
          </button>
        ) : (
          <button
            type="button"
            className="provider-btn provider-btn--secondary provider-service-card-action-btn provider-service-card-action-btn--accent"
            onClick={() => onReactivate(service)}
            disabled={isReactivating}
          >
            <UnsuspendActionIcon className="provider-btn-icon" />
            {isReactivating ? "Reactivating..." : "Reactivate"}
          </button>
        )}
        <button
          type="button"
          className="provider-btn provider-btn--danger provider-service-card-action-btn"
          onClick={() => onDelete(service)}
        >
          <DeleteActionIcon className="provider-btn-icon" />
          Delete
        </button>
      </div>
    </li>
  );
}
