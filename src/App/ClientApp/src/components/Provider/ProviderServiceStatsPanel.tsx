import { formatPrice } from "../../utils/formatService";
import type { ProviderServiceStats } from "../../utils/providerPanelUtils";

interface ProviderServiceStatsPanelProps {
  stats: ProviderServiceStats;
}

export function ProviderServiceStatsPanel({
  stats,
}: ProviderServiceStatsPanelProps) {
  const hasActivity =
    stats.completedCount > 0 ||
    stats.cancelledCount > 0 ||
    stats.noShowCount > 0;

  return (
    <div className="provider-service-stats" aria-label="Service performance">
      <div className="provider-service-stats-revenue">
        <span className="provider-service-stats-revenue-label">
          Revenue earned
        </span>
        <span className="provider-service-stats-revenue-value">
          {formatPrice(stats.revenueEarned)}
        </span>
        <span className="provider-service-stats-revenue-hint">
          From completed appointments
        </span>
      </div>

      <div className="provider-service-stats-grid">
        <div className="provider-service-stat">
          <span className="provider-service-stat-value">
            {stats.completedCount}
          </span>
          <span className="provider-service-stat-label">Completed</span>
        </div>
        <div className="provider-service-stat">
          <span className="provider-service-stat-value">
            {stats.cancelledCount}
          </span>
          <span className="provider-service-stat-label">Cancelled</span>
        </div>
        <div className="provider-service-stat">
          <span className="provider-service-stat-value">{stats.noShowCount}</span>
          <span className="provider-service-stat-label">No-show</span>
        </div>
      </div>

      {!hasActivity && (
        <p className="provider-service-stats-empty">
          No completed, cancelled, or no-show appointments yet for this service.
        </p>
      )}
    </div>
  );
}
