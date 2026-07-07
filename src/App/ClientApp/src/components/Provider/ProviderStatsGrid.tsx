import type { ProviderStats } from "../../utils/providerPanelUtils";

interface ProviderStatsGridProps {
  stats: ProviderStats;
}

export function ProviderStatsGrid({ stats }: ProviderStatsGridProps) {
  return (
    <div className="provider-stat-grid" aria-label="Provider statistics">
      <div className="provider-stat-card provider-stat-card--upcoming">
        <span className="provider-stat-card-value">{stats.upcoming}</span>
        <span className="provider-stat-card-label">Upcoming</span>
      </div>
      <div className="provider-stat-card provider-stat-card--today">
        <span className="provider-stat-card-value">{stats.today}</span>
        <span className="provider-stat-card-label">Today</span>
      </div>
      <div className="provider-stat-card">
        <span className="provider-stat-card-value">{stats.booked}</span>
        <span className="provider-stat-card-label">Active bookings</span>
      </div>
      <div className="provider-stat-card provider-stat-card--services">
        <span className="provider-stat-card-value">{stats.services}</span>
        <span className="provider-stat-card-label">Listed services</span>
      </div>
    </div>
  );
}
