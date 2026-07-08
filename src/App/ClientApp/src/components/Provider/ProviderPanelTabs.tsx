import type { CSSProperties } from "react";
import {
  ProviderAppointmentsTabIcon,
  ProviderCancelledTabIcon,
  ProviderPastTabIcon,
  ProviderPendingTabIcon,
} from "./ProviderIcons";
import type { ProviderAppointmentTab } from "./ProviderPanelTabs.types";

export type { ProviderAppointmentTab };

interface ProviderPanelTabsProps {
  activeTab: ProviderAppointmentTab;
  pendingCount: number;
  onTabChange: (tab: ProviderAppointmentTab) => void;
}

const tabs = [
  {
    id: "appointments" as const,
    label: "Upcoming",
    icon: ProviderAppointmentsTabIcon,
    badge: false,
  },
  {
    id: "pending" as const,
    label: "Pending",
    icon: ProviderPendingTabIcon,
    badge: true,
  },
  {
    id: "past" as const,
    label: "Past",
    icon: ProviderPastTabIcon,
    badge: false,
  },
  {
    id: "cancelled" as const,
    label: "Cancelled",
    icon: ProviderCancelledTabIcon,
    badge: false,
  },
];

export function ProviderPanelTabs({
  activeTab,
  pendingCount,
  onTabChange,
}: ProviderPanelTabsProps) {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <div
      className="provider-tabs"
      role="tablist"
      aria-label="Provider panel sections"
      style={
        {
          "--tab-index": activeIndex,
        } as CSSProperties
      }
    >
      <span className="provider-tab-indicator" aria-hidden="true" />
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showBadge = tab.badge && pendingCount > 0;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`provider-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`provider-panel-${tab.id}`}
            aria-label={`${tab.label} appointments`}
            className={`provider-tab${isActive ? " provider-tab--active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="provider-tab-icon" />
            <span>{tab.label}</span>
            {showBadge && (
              <span className="provider-tab-badge" aria-hidden="true">
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
