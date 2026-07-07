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
    catalogQuery,
    reloadAppointments,
  } = useProviderPanelData(userId);

  const displayName = capitalizeFirstLetter(username ?? "Provider");
  const isInitialLoading =
    appointmentsQuery.isLoading && catalogQuery.isLoading;

  return (
    <div className="provider">
      <div className="provider-inner">
        <header className="provider-header">
          <h1 className="provider-title">Provider Panel</h1>
          <p className="provider-subtitle">
            Hi {displayName} — manage your bookings and service listings.
          </p>
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

            {activeTab === "appointments" ? (
              <ProviderAppointmentsSection
                upcomingAppointments={upcomingAppointments}
                isLoading={appointmentsQuery.isLoading}
                error={appointmentsQuery.error}
                onUpdated={reloadAppointments}
              />
            ) : (
              <ProviderServicesSection
                services={services}
                isLoading={catalogQuery.isLoading}
                error={catalogQuery.error}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProviderPanel;
