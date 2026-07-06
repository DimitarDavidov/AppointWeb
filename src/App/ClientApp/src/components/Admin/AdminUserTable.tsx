import {
  formatJoinedDate,
  roleBadgeClass,
  UserActionButtons,
} from "./AdminUserCard";
import type { AdminUser } from "../../types/admin";
import { formatRoleLabel } from "../../constants/roles";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";

export interface AdminUserHandlers {
  isSelf: boolean;
  onEdit: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onDelete: () => void;
}

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
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const handlers = getUserHandlers(user);

            return (
              <tr
                key={user.id}
                className={user.isSuspended ? "admin-table-row--suspended" : ""}
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
                <td>{formatJoinedDate(user.createdAt)}</td>
                <td>
                  <UserActionButtons user={user} {...handlers} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
