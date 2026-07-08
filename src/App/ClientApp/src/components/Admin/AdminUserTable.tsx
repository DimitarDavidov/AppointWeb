import { Fragment } from "react";
import {
  formatJoinedDate,
  roleBadgeClass,
  UserActionButtons,
} from "./AdminUserCard";
import type { AdminServiceStats, AdminUser } from "../../types/admin";
import { formatRoleLabel, UserRoles } from "../../constants/roles";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { formatPrice } from "../../utils/formatService";
import { ChevronActionIcon } from "./AdminActionIcons";
import {
  AdminUserServicesBreakdown,
  type AdminServicesState,
} from "./AdminUserServicesBreakdown";

export interface AdminUserHandlers {
  isSelf: boolean;
  isExpanded: boolean;
  servicesState: AdminServicesState | undefined;
  isDownloadingCsv: boolean;
  downloadingServiceId: string | null;
  onEdit: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onDownloadCsv: () => void;
  onDownloadServiceCsv: (service: AdminServiceStats) => void;
}

const COLUMN_COUNT = 11;

interface AdminUserTableProps {
  users: AdminUser[];
  getUserHandlers: (user: AdminUser) => AdminUserHandlers;
}

export function AdminUserTable({
  users,
  getUserHandlers,
}: AdminUserTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Services</th>
            <th>Completed</th>
            <th>Cancelled</th>
            <th>Revenue</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const handlers = getUserHandlers(user);
            const isProvider = user.role === UserRoles.Provider;
            const canExpand = isProvider && user.serviceCount > 0;

            return (
              <Fragment key={user.id}>
                <tr
                  className={
                    user.isSuspended ? "admin-table-row--suspended" : ""
                  }
                >
                  <td>
                    <div className="admin-user-cell">
                      <strong>{capitalizeFirstLetter(user.username)}</strong>
                      {handlers.isSelf && <span>Your account</span>}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber || "—"}</td>
                  <td>
                    <span className={roleBadgeClass(user.role)}>
                      {formatRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        user.isSuspended
                          ? "admin-badge admin-badge--suspended"
                          : "admin-badge admin-badge--active"
                      }
                    >
                      {user.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td>
                    {isProvider ? (
                      canExpand ? (
                        <button
                          type="button"
                          className="admin-expand-btn"
                          aria-expanded={handlers.isExpanded}
                          onClick={handlers.onToggleExpand}
                        >
                          <span>{user.serviceCount}</span>
                          <ChevronActionIcon
                            className={`admin-chevron${
                              handlers.isExpanded ? " admin-chevron--open" : ""
                            }`}
                          />
                        </button>
                      ) : (
                        user.serviceCount
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="admin-num admin-num--completed">
                    {user.completedCount}
                  </td>
                  <td className="admin-num admin-num--cancelled">
                    {user.cancelledCount > 0 ? (
                      <button
                        type="button"
                        className="admin-cancelled-btn"
                        disabled={handlers.isDownloadingCsv}
                        title="Download this user's cancelled appointments as CSV"
                        onClick={handlers.onDownloadCsv}
                      >
                        {handlers.isDownloadingCsv
                          ? "…"
                          : user.cancelledCount}
                      </button>
                    ) : (
                      user.cancelledCount
                    )}
                  </td>
                  <td className="admin-num admin-num--revenue">
                    {isProvider ? formatPrice(user.totalRevenue) : "—"}
                  </td>
                  <td>{formatJoinedDate(user.createdAt)}</td>
                  <td>
                    <UserActionButtons user={user} {...handlers} />
                  </td>
                </tr>
                {handlers.isExpanded && (
                  <tr className="admin-table-detail-row">
                    <td colSpan={COLUMN_COUNT}>
                      <AdminUserServicesBreakdown
                        state={handlers.servicesState}
                        downloadingServiceId={handlers.downloadingServiceId}
                        onDownloadServiceCsv={handlers.onDownloadServiceCsv}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
