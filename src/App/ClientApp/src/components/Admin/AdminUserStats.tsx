import type { AdminUser } from "../../types/admin";
import { UserRoles } from "../../constants/roles";
import { formatPrice } from "../../utils/formatService";

interface AdminUserStatsProps {
  user: AdminUser;
  layout?: "card" | "row";
  isDownloadingCsv: boolean;
  onDownloadCsv: () => void;
}

export function AdminUserStats({
  user,
  layout = "card",
  isDownloadingCsv,
  onDownloadCsv,
}: AdminUserStatsProps) {
  const isProvider = user.role === UserRoles.Provider;

  return (
    <div className={`admin-stats admin-stats--${layout}`}>
      {isProvider && (
        <div className="admin-stat-chip">
          <span className="admin-stat-chip-value">{user.serviceCount}</span>
          <span className="admin-stat-chip-label">Services</span>
        </div>
      )}
      <div className="admin-stat-chip">
        <span className="admin-stat-chip-value admin-stat-chip-value--completed">
          {user.completedCount}
        </span>
        <span className="admin-stat-chip-label">Completed</span>
      </div>
      <div className="admin-stat-chip">
        {user.cancelledCount > 0 ? (
          <button
            type="button"
            className="admin-stat-chip-value admin-stat-chip-value--cancelled admin-stat-chip-btn"
            disabled={isDownloadingCsv}
            title="Download this user's cancelled appointments as CSV"
            onClick={onDownloadCsv}
          >
            {isDownloadingCsv ? "…" : user.cancelledCount}
          </button>
        ) : (
          <span className="admin-stat-chip-value admin-stat-chip-value--cancelled">
            {user.cancelledCount}
          </span>
        )}
        <span className="admin-stat-chip-label">Cancelled</span>
      </div>
      {isProvider && (
        <div className="admin-stat-chip admin-stat-chip--revenue">
          <span className="admin-stat-chip-value admin-stat-chip-value--revenue">
            {formatPrice(user.totalRevenue)}
          </span>
          <span className="admin-stat-chip-label">Revenue</span>
        </div>
      )}
    </div>
  );
}
