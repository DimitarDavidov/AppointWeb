import { useState } from "react";
import { SpinnerIcon } from "../components/Account/AccountIcons";
import { ProviderAppointmentsSection } from "../components/Provider/ProviderAppointmentsSection";
import {
  ProviderPanelTabs,
  type ProviderPanelTab,
} from "../components/Provider/ProviderPanelTabs";
import { ProviderServicesSection } from "../components/Provider/ProviderServicesSection";
import { ProviderStatsGrid } from "../components/Provider/ProviderStatsGrid";
import { useProviderPanelData } from "../hooks/useProviderPanelData";
import { useAppSelector } from "../store/hooks";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import "./ProviderPanel.scss";

function ProviderPanel() {
  const { userId, username } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<ProviderPanelTab>("appointments");

  const {
    services,
    upcomingAppointments,
    stats,
    appointmentsQuery,
    servicesQuery,
    reloadAppointments,
    reloadServices,
  } = useProviderPanelData();

  const displayName = capitalizeFirstLetter(username ?? "Provider");
  const userInitial = displayName.charAt(0).toUpperCase();
  const isInitialLoading =
    appointmentsQuery.isLoading && servicesQuery.isLoading;

  return (
    <div className="provider">
      <div className="provider-inner">
        <header className="provider-header">
          <div className="provider-header-content">
            <span className="provider-header-avatar" aria-hidden="true">
              {userInitial}
            </span>
            <div>
              <h1 className="provider-title">Provider Panel</h1>
              <p className="provider-subtitle">
                Hi {displayName} — manage your bookings and service listings.
              </p>
            </div>
          </div>
        </header>

        {isInitialLoading ? (
          <div className="provider-loading" aria-live="polite">
            <SpinnerIcon className="provider-loading-spinner" />
            <p>Loading your provider dashboard...</p>
          </div>
        ) : (
          <>
            <ProviderStatsGrid stats={stats} />

            <ProviderPanelTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div key={activeTab} className="provider-tab-panel-wrap">
              {activeTab === "appointments" ? (
                <ProviderAppointmentsSection
                  upcomingAppointments={upcomingAppointments}
                  isLoading={appointmentsQuery.isLoading}
                  error={appointmentsQuery.error}
                  onUpdated={reloadAppointments}
                />
              ) : (
                <ProviderServicesSection
                  providerId={userId}
                  services={services}
                  isLoading={servicesQuery.isLoading}
                  error={servicesQuery.error}
                  onUpdated={reloadServices}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProviderPanel;
