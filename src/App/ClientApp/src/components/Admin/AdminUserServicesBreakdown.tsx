import type { AdminServiceStats } from "../../types/admin";
import { formatPrice } from "../../utils/formatService";
import { SpinnerIcon } from "../Account/AccountIcons";

export interface AdminServicesState {
  loading: boolean;
  error: string;
  data: AdminServiceStats[];
}

interface AdminUserServicesBreakdownProps {
  state: AdminServicesState | undefined;
  downloadingServiceId: string | null;
  onDownloadServiceCsv: (service: AdminServiceStats) => void;
}

export function AdminUserServicesBreakdown({
  state,
  downloadingServiceId,
  onDownloadServiceCsv,
}: AdminUserServicesBreakdownProps) {
  if (!state || state.loading) {
    return (
      <div className="admin-breakdown-status" aria-live="polite">
        <SpinnerIcon className="admin-breakdown-spinner" />
        <span>Loading services…</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <p className="admin-breakdown-status admin-breakdown-status--error" role="alert">
        {state.error}
      </p>
    );
  }

  if (state.data.length === 0) {
    return <p className="admin-breakdown-empty">This user has no services.</p>;
  }

  const totalRevenue = state.data.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <div className="admin-breakdown">
      <div className="admin-breakdown-table-wrap">
        <table className="admin-breakdown-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Price</th>
              <th>Bookings</th>
              <th>Completed</th>
              <th>Cancelled</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((service) => (
              <tr key={service.serviceId}>
                <td>
                  <div className="admin-breakdown-service">
                    <span className="admin-breakdown-service-name">
                      {service.serviceName}
                    </span>
                    <span className="admin-breakdown-service-meta">
                      {service.category ?? "Uncategorized"}
                      {!service.isActive && " · Removed"}
                    </span>
                  </div>
                </td>
                <td>{formatPrice(service.price)}</td>
                <td>{service.totalAppointments}</td>
                <td className="admin-breakdown-num admin-breakdown-num--completed">
                  {service.completedCount}
                </td>
                <td className="admin-breakdown-num admin-breakdown-num--cancelled">
                  {service.cancelledCount > 0 ? (
                    <button
                      type="button"
                      className="admin-breakdown-cancelled-btn"
                      disabled={downloadingServiceId === service.serviceId}
                      title="Download this service's cancelled appointments as CSV"
                      onClick={() => onDownloadServiceCsv(service)}
                    >
                      {downloadingServiceId === service.serviceId
                        ? "…"
                        : service.cancelledCount}
                    </button>
                  ) : (
                    service.cancelledCount
                  )}
                </td>
                <td className="admin-breakdown-num admin-breakdown-num--revenue">
                  {formatPrice(service.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Total revenue</td>
              <td className="admin-breakdown-num admin-breakdown-num--revenue">
                {formatPrice(totalRevenue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
