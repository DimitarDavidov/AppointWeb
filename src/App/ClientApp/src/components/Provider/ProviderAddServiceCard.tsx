import { ProviderServiceIcon } from "./ProviderIcons";

interface ProviderAddServiceCardProps {
  onAdd: () => void;
  index: number;
}

export function ProviderAddServiceCard({ onAdd, index }: ProviderAddServiceCardProps) {
  return (
    <li
      className="provider-service-add-card"
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
      <button type="button" className="provider-service-add-card-btn" onClick={onAdd}>
        <span className="provider-service-add-card-icon" aria-hidden="true">
          <ProviderServiceIcon />
          <span className="provider-service-add-card-plus">+</span>
        </span>
        <span className="provider-service-add-card-title">Add service</span>
        <span className="provider-service-add-card-hint">
          Create a new listing for your catalog
        </span>
      </button>
    </li>
  );
}
