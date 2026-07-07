export type ProviderPanelTab = "appointments" | "services";

interface ProviderPanelTabsProps {
  activeTab: ProviderPanelTab;
  onTabChange: (tab: ProviderPanelTab) => void;
}

export function ProviderPanelTabs({
  activeTab,
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
        className={`provider-tab${activeTab === "appointments" ? " provider-tab--active" : ""}`}
        onClick={() => onTabChange("appointments")}
      >
        Upcoming appointments
      </button>
      <button
        type="button"
        role="tab"
        id="provider-tab-services"
        aria-selected={activeTab === "services"}
        aria-controls="provider-panel-services"
        className={`provider-tab${activeTab === "services" ? " provider-tab--active" : ""}`}
        onClick={() => onTabChange("services")}
      >
        My services
      </button>
    </div>
  );
}
