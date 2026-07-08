import { useMemo, useState } from "react";
import { ProviderAppointmentsSection } from "../components/Provider/ProviderAppointmentsSection";
import { ProviderCancelledAppointmentsSection } from "../components/Provider/ProviderCancelledAppointmentsSection";
import { ProviderPastAppointmentsSection } from "../components/Provider/ProviderPastAppointmentsSection";
import { ProviderPendingAppointmentsSection } from "../components/Provider/ProviderPendingAppointmentsSection";
import { ProviderPanelSkeleton } from "../components/Provider/ProviderPanelSkeleton";
import { ProviderPanelTabs } from "../components/Provider/ProviderPanelTabs";
import {
  PROVIDER_TAB_ORDER,
  type ProviderAppointmentTab,
} from "../components/Provider/ProviderPanelTabs.types";
import { ProviderServicesSection } from "../components/Provider/ProviderServicesSection";
import { ProviderStatsGrid, type ProviderStatCardKey } from "../components/Provider/ProviderStatsGrid";
import { ProviderServicesTabIcon } from "../components/Provider/ProviderIcons";
import { useProviderPanelData } from "../hooks/useProviderPanelData";
import { filterUpcomingAppointmentsForToday } from "../utils/providerPanelUtils";
import { useAppSelector } from "../store/hooks";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { getTimeGreeting } from "../utils/getTimeGreeting";
import "./ProviderPanel.scss";

function ProviderPanel() {
  const { userId, username } = useAppSelector((state) => state.auth);
  const [appointmentTab, setAppointmentTab] =
    useState<ProviderAppointmentTab>("appointments");
  const [showServices, setShowServices] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);
  const [panelDirection, setPanelDirection] = useState<"forward" | "back">(
    "forward"
  );

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
    const currentIndex = PROVIDER_TAB_ORDER.indexOf(appointmentTab);
    const nextIndex = PROVIDER_TAB_ORDER.indexOf(tab);
    setPanelDirection(nextIndex >= currentIndex ? "forward" : "back");
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

  const greeting = getTimeGreeting();

  return (
    <div className="provider">
      <div className="provider-bg-decor" aria-hidden="true">
        <span className="provider-bg-orb provider-bg-orb--teal" />
        <span className="provider-bg-orb provider-bg-orb--violet" />
      </div>

      <div className="provider-inner">
        <header className="provider-header">
          <div className="provider-header-card">
            <div className="provider-header-row">
              <div className="provider-header-content">
                <span className="provider-header-avatar" aria-hidden="true">
                  {userInitial}
                </span>
                <div>
                  <p className="provider-greeting">{greeting}</p>
                  <h1 className="provider-title">{displayName}</h1>
                  <p className="provider-subtitle">
                    Manage your bookings, confirm requests, and keep your
                    services up to date.
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
          </div>
        </header>

        {isInitialLoading ? (
          <ProviderPanelSkeleton />
        ) : (
          <div className="provider-dashboard">
            <ProviderStatsGrid
              stats={stats}
              activeStat={activeStat}
              onStatClick={handleStatClick}
            />

            {showServices ? (
              <div className="provider-tab-panel-wrap provider-tab-panel-wrap--services">
                <button
                  type="button"
                  className="provider-back-to-appointments"
                  onClick={() => openAppointments()}
                >
                  <span className="provider-back-to-appointments-icon" aria-hidden="true">
                    ←
                  </span>
                  Back to appointments
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

                <div
                  key={`${appointmentTab}-${todayOnly}`}
                  className={`provider-tab-panel-wrap provider-tab-panel-wrap--${panelDirection}`}
                >
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
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderPanel;
