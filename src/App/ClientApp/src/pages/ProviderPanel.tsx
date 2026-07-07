import { useMemo, useState } from "react";
import { SpinnerIcon } from "../components/Account/AccountIcons";
import { ProviderAppointmentsSection } from "../components/Provider/ProviderAppointmentsSection";
import { ProviderCancelledAppointmentsSection } from "../components/Provider/ProviderCancelledAppointmentsSection";
import { ProviderPastAppointmentsSection } from "../components/Provider/ProviderPastAppointmentsSection";
import { ProviderPendingAppointmentsSection } from "../components/Provider/ProviderPendingAppointmentsSection";
import {
  ProviderPanelTabs,
  type ProviderAppointmentTab,
} from "../components/Provider/ProviderPanelTabs";
import { ProviderServicesSection } from "../components/Provider/ProviderServicesSection";
import { ProviderStatsGrid, type ProviderStatCardKey } from "../components/Provider/ProviderStatsGrid";
import { ProviderServicesTabIcon } from "../components/Provider/ProviderIcons";
import { useProviderPanelData } from "../hooks/useProviderPanelData";
import { filterUpcomingAppointmentsForToday } from "../utils/providerPanelUtils";
import { useAppSelector } from "../store/hooks";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import "./ProviderPanel.scss";

function ProviderPanel() {
  const { userId, username } = useAppSelector((state) => state.auth);
  const [appointmentTab, setAppointmentTab] =
    useState<ProviderAppointmentTab>("appointments");
  const [showServices, setShowServices] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);

  const {
    services,
    upcomingAppointments,
    pendingAppointments,
    pastAppointments,
    cancelledAppointments,
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

  function openServices() {
    setShowServices(true);
    setTodayOnly(false);
  }

  function openAppointments(
    tab: ProviderAppointmentTab = appointmentTab,
    filterToday = false
  ) {
    setShowServices(false);
    setAppointmentTab(tab);
    setTodayOnly(filterToday);
  }

  function handleStatClick(key: ProviderStatCardKey) {
    switch (key) {
      case "upcoming":
        openAppointments("appointments", false);
        break;
      case "today":
        openAppointments("appointments", true);
        break;
      case "pending":
        openAppointments("pending", false);
        break;
      case "services":
        openServices();
        break;
    }
  }

  function handleTabChange(tab: ProviderAppointmentTab) {
    setTodayOnly(false);
    setAppointmentTab(tab);
  }

  const displayedUpcomingAppointments = useMemo(
    () =>
      todayOnly
        ? filterUpcomingAppointmentsForToday(upcomingAppointments)
        : upcomingAppointments,
    [todayOnly, upcomingAppointments]
  );

  const activeStat: ProviderStatCardKey | null = showServices
    ? "services"
    : appointmentTab === "pending"
      ? "pending"
      : appointmentTab === "appointments" && todayOnly
        ? "today"
        : appointmentTab === "appointments"
          ? "upcoming"
          : null;

  return (
    <div className="provider">
      <div className="provider-inner">
        <header className="provider-header">
          <div className="provider-header-row">
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

            <button
              type="button"
              className={`provider-header-services-btn${
                showServices ? " provider-header-services-btn--active" : ""
              }`}
              aria-pressed={showServices}
              onClick={openServices}
            >
              <ProviderServicesTabIcon className="provider-header-services-icon" />
              <span className="provider-header-services-label">My services</span>
              <span className="provider-header-services-count">{stats.services}</span>
            </button>
          </div>
        </header>

        {isInitialLoading ? (
          <div className="provider-loading" aria-live="polite">
            <SpinnerIcon className="provider-loading-spinner" />
            <p>Loading your provider dashboard...</p>
          </div>
        ) : (
          <>
            <ProviderStatsGrid
              stats={stats}
              activeStat={activeStat}
              onStatClick={handleStatClick}
            />

            {showServices ? (
              <div className="provider-tab-panel-wrap">
                <button
                  type="button"
                  className="provider-back-to-appointments"
                  onClick={() => openAppointments()}
                >
                  ← Back to appointments
                </button>
                <ProviderServicesSection
                  providerId={userId}
                  services={services}
                  isLoading={servicesQuery.isLoading}
                  error={servicesQuery.error}
                  onUpdated={reloadServices}
                />
              </div>
            ) : (
              <>
                <ProviderPanelTabs
                  activeTab={appointmentTab}
                  pendingCount={stats.pending}
                  onTabChange={handleTabChange}
                />

                <div key={`${appointmentTab}-${todayOnly}`} className="provider-tab-panel-wrap">
                  {appointmentTab === "appointments" ? (
                    <ProviderAppointmentsSection
                      upcomingAppointments={displayedUpcomingAppointments}
                      todayOnly={todayOnly}
                      isLoading={appointmentsQuery.isLoading}
                      error={appointmentsQuery.error}
                      onUpdated={reloadAppointments}
                    />
                  ) : appointmentTab === "pending" ? (
                    <ProviderPendingAppointmentsSection
                      pendingAppointments={pendingAppointments}
                      isLoading={appointmentsQuery.isLoading}
                      error={appointmentsQuery.error}
                      onUpdated={reloadAppointments}
                    />
                  ) : appointmentTab === "past" ? (
                    <ProviderPastAppointmentsSection
                      pastAppointments={pastAppointments}
                      isLoading={appointmentsQuery.isLoading}
                      error={appointmentsQuery.error}
                      onUpdated={reloadAppointments}
                    />
                  ) : (
                    <ProviderCancelledAppointmentsSection
                      cancelledAppointments={cancelledAppointments}
                      isLoading={appointmentsQuery.isLoading}
                      error={appointmentsQuery.error}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProviderPanel;
