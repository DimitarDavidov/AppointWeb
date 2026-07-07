import {
  ProviderAppointmentsTabIcon,
  ProviderCancelledTabIcon,
  ProviderPastTabIcon,
  ProviderPendingTabIcon,
} from "./ProviderIcons";

export type ProviderAppointmentTab =
  | "appointments"
  | "pending"
  | "past"
  | "cancelled";

interface ProviderPanelTabsProps {
  activeTab: ProviderAppointmentTab;
  pendingCount: number;
  onTabChange: (tab: ProviderAppointmentTab) => void;
}

export function ProviderPanelTabs({
  activeTab,
  pendingCount,
  onTabChange,
}: ProviderPanelTabsProps) {
  return (
    <div
      className="provider-tabs"
      role="tablist"
      aria-label="Provider panel sections"
    >
      <button
        type="button"
        role="tab"
        id="provider-tab-appointments"
        aria-selected={activeTab === "appointments"}
        aria-controls="provider-panel-appointments"
        aria-label="Upcoming appointments"
        className={`provider-tab${activeTab === "appointments" ? " provider-tab--active" : ""}`}
        onClick={() => onTabChange("appointments")}
      >
        <ProviderAppointmentsTabIcon className="provider-tab-icon" />
        <span>Upcoming</span>
      </button>
      <button
        type="button"
        role="tab"
        id="provider-tab-pending"
        aria-selected={activeTab === "pending"}
        aria-controls="provider-panel-pending"
        aria-label="Pending appointments"
        className={`provider-tab${activeTab === "pending" ? " provider-tab--active" : ""}`}
        onClick={() => onTabChange("pending")}
      >
        <ProviderPendingTabIcon className="provider-tab-icon" />
        <span>Pending</span>
        {pendingCount > 0 && (
          <span className="provider-tab-badge" aria-hidden="true">
            {pendingCount}
          </span>
        )}
      </button>
      <button
        type="button"
        role="tab"
        id="provider-tab-past"
        aria-selected={activeTab === "past"}
        aria-controls="provider-panel-past"
        aria-label="Past appointments"
        className={`provider-tab${activeTab === "past" ? " provider-tab--active" : ""}`}
        onClick={() => onTabChange("past")}
      >
        <ProviderPastTabIcon className="provider-tab-icon" />
        <span>Past</span>
      </button>
      <button
        type="button"
        role="tab"
        id="provider-tab-cancelled"
        aria-selected={activeTab === "cancelled"}
        aria-controls="provider-panel-cancelled"
        aria-label="Cancelled appointments"
        className={`provider-tab${activeTab === "cancelled" ? " provider-tab--active" : ""}`}
        onClick={() => onTabChange("cancelled")}
      >
        <ProviderCancelledTabIcon className="provider-tab-icon" />
        <span>Cancelled</span>
      </button>
    </div>
  );
}
