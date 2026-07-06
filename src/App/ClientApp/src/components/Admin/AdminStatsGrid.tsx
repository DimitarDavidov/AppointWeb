interface AdminStatsGridProps {
  total: number;
  active: number;
  suspended: number;
}

export function AdminStatsGrid({ total, active, suspended }: AdminStatsGridProps) {
  return (
    <div className="admin-stat-grid" aria-label="User statistics">
      <div className="admin-stat-card">
        <span className="admin-stat-card-value">{total}</span>
        <span className="admin-stat-card-label">Total users</span>
      </div>
      <div className="admin-stat-card admin-stat-card--active">
        <span className="admin-stat-card-value">{active}</span>
        <span className="admin-stat-card-label">Active</span>
      </div>
      <div className="admin-stat-card admin-stat-card--suspended">
        <span className="admin-stat-card-value">{suspended}</span>
        <span className="admin-stat-card-label">Suspended</span>
      </div>
    </div>
  );
}
