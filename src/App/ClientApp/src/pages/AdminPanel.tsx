import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deleteAdminUser,
  getAdminUsers,
  suspendAdminUser,
  unsuspendAdminUser,
  updateAdminUser,
} from "../api/admin";
import { getErrorMessage } from "../api/auth";
import {
  AdminUserCard,
  formatJoinedDate,
  roleBadgeClass,
  UserActionButtons,
} from "../components/Admin/AdminUserCard";
import EditUserModal from "../components/Admin/EditUserModal";
import { SpinnerIcon } from "../components/Account/AccountIcons";
import ConfirmDialog from "../components/ConfirmDialog/ConfirmDialog";
import {
  formatRoleLabel,
  UserRoles,
  type UserRole,
} from "../constants/roles";
import { useAppSelector } from "../store/hooks";
import type { AdminUser, UpdateAdminUserRequest } from "../types/admin";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import "./AdminPanel.scss";

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "suspended";
type DialogAction = "suspend" | "unsuspend" | "delete" | null;

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function matchesSearch(user: AdminUser, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    user.username.toLowerCase().includes(normalized) ||
    user.email.toLowerCase().includes(normalized) ||
    (user.phoneNumber?.toLowerCase().includes(normalized) ?? false)
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, role, userId } = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [message, setMessage] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [dialogTarget, setDialogTarget] = useState<AdminUser | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);

  const isAdmin = role === UserRoles.Admin;

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
      return;
    }

    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [accessToken, isAdmin, location.pathname, navigate]);

  useEffect(() => {
    if (!accessToken || !isAdmin) return;

    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await getAdminUsers();
        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            getErrorMessage(err, "Could not load users. Please try again.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAdmin]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        if (roleFilter !== "all" && user.role !== roleFilter) return false;
        if (statusFilter === "active" && user.isSuspended) return false;
        if (statusFilter === "suspended" && !user.isSuspended) return false;
        return matchesSearch(user, searchQuery);
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [users, roleFilter, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      suspended: users.filter((user) => user.isSuspended).length,
      active: users.filter((user) => !user.isSuspended).length,
    };
  }, [users]);

  function isCurrentUser(id: string): boolean {
    return userId === id;
  }

  function openDialog(action: DialogAction, user: AdminUser) {
    setDialogAction(action);
    setDialogTarget(user);
    setDialogError("");
  }

  function closeDialog() {
    if (isDialogSubmitting) return;
    setDialogAction(null);
    setDialogTarget(null);
    setDialogError("");
  }

  function openEdit(user: AdminUser) {
    setEditError("");
    setEditingUser(user);
  }

  function getUserHandlers(user: AdminUser) {
    const isSelf = isCurrentUser(user.id);

    return {
      isSelf,
      onEdit: () => openEdit(user),
      onSuspend: () => openDialog("suspend", user),
      onUnsuspend: () => openDialog("unsuspend", user),
      onDelete: () => openDialog("delete", user),
    };
  }

  async function handleSaveEdit(id: string, data: UpdateAdminUserRequest) {
    setIsSavingEdit(true);
    setEditError("");

    try {
      const updated = await updateAdminUser(id, data);
      setUsers((current) =>
        current.map((user) => (user.id === id ? updated : user))
      );
      setEditingUser(null);
      setMessage(`Updated ${capitalizeFirstLetter(updated.username)}.`);
    } catch (err) {
      setEditError(getErrorMessage(err, "Could not save changes."));
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleConfirmDialog() {
    if (!dialogTarget || !dialogAction) return;

    setDialogError("");
    setIsDialogSubmitting(true);

    try {
      if (dialogAction === "delete") {
        await deleteAdminUser(dialogTarget.id);
        setUsers((current) =>
          current.filter((user) => user.id !== dialogTarget.id)
        );
        setMessage(`Deleted ${capitalizeFirstLetter(dialogTarget.username)}.`);
      } else if (dialogAction === "suspend") {
        const updated = await suspendAdminUser(dialogTarget.id);
        setUsers((current) =>
          current.map((user) => (user.id === updated.id ? updated : user))
        );
        setMessage(`Suspended ${capitalizeFirstLetter(updated.username)}.`);
      } else if (dialogAction === "unsuspend") {
        const updated = await unsuspendAdminUser(dialogTarget.id);
        setUsers((current) =>
          current.map((user) => (user.id === updated.id ? updated : user))
        );
        setMessage(`Reactivated ${capitalizeFirstLetter(updated.username)}.`);
      }

      closeDialog();
    } catch (err) {
      setDialogError(
        getErrorMessage(err, "Could not complete this action. Please try again.")
      );
    } finally {
      setIsDialogSubmitting(false);
    }
  }

  if (!accessToken || !isAdmin) {
    return null;
  }

  const dialogTitle =
    dialogAction === "delete"
      ? "Delete user account?"
      : dialogAction === "suspend"
        ? "Suspend user?"
        : dialogAction === "unsuspend"
          ? "Reactivate user?"
          : "";

  const dialogConfirmLabel =
    dialogAction === "delete"
      ? "Delete account"
      : dialogAction === "suspend"
        ? "Suspend user"
        : dialogAction === "unsuspend"
          ? "Reactivate user"
          : "Confirm";

  return (
    <div className="admin">
      <EditUserModal
        user={editingUser}
        isSaving={isSavingEdit}
        error={editError}
        onSave={handleSaveEdit}
        onClose={() => {
          if (isSavingEdit) return;
          setEditingUser(null);
          setEditError("");
        }}
      />

      <ConfirmDialog
        open={dialogAction !== null && dialogTarget !== null}
        title={dialogTitle}
        confirmLabel={dialogConfirmLabel}
        cancelLabel="Cancel"
        isConfirming={isDialogSubmitting}
        onConfirm={handleConfirmDialog}
        onClose={closeDialog}
      >
        {dialogTarget && (
          <>
            {dialogAction === "delete" && (
              <p>
                This permanently removes{" "}
                <strong>{capitalizeFirstLetter(dialogTarget.username)}</strong>{" "}
                and all related data. This action cannot be undone.
              </p>
            )}
            {dialogAction === "suspend" && (
              <p>
                <strong>{capitalizeFirstLetter(dialogTarget.username)}</strong>{" "}
                will not be able to log in or book appointments while suspended.
              </p>
            )}
            {dialogAction === "unsuspend" && (
              <p>
                <strong>{capitalizeFirstLetter(dialogTarget.username)}</strong>{" "}
                will regain full access to their account.
              </p>
            )}
          </>
        )}
        {dialogError && (
          <p className="admin-status admin-status--error" role="alert">
            {dialogError}
          </p>
        )}
      </ConfirmDialog>

      <div className="admin-inner">
        <header className="admin-header">
          <h1 className="admin-title">Admin Panel</h1>
          <p className="admin-subtitle">
            Manage user accounts across the platform.
          </p>
        </header>

        {message && (
          <p className="admin-toast" role="status">
            {message}
          </p>
        )}

        <div className="admin-stat-grid" aria-label="User statistics">
          <div className="admin-stat-card">
            <span className="admin-stat-card-value">{counts.total}</span>
            <span className="admin-stat-card-label">Total users</span>
          </div>
          <div className="admin-stat-card admin-stat-card--active">
            <span className="admin-stat-card-value">{counts.active}</span>
            <span className="admin-stat-card-label">Active</span>
          </div>
          <div className="admin-stat-card admin-stat-card--suspended">
            <span className="admin-stat-card-value">{counts.suspended}</span>
            <span className="admin-stat-card-label">Suspended</span>
          </div>
        </div>

        <div className="admin-toolbar">
          <label className="admin-search" htmlFor="admin-user-search">
            <SearchIcon />
            <input
              id="admin-user-search"
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <div className="admin-filters">
            <select
              className="admin-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              <option value={UserRoles.Customer}>Customers</option>
              <option value={UserRoles.Provider}>Providers</option>
              <option value={UserRoles.Admin}>Admins</option>
            </select>

            <select
              className="admin-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="admin-loading" aria-live="polite">
            <SpinnerIcon className="admin-loading-spinner" />
            <p>Loading users...</p>
          </div>
        )}

        {loadError && !isLoading && (
          <p className="admin-status admin-status--error" role="alert">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && filteredUsers.length === 0 && (
          <p className="admin-empty">No users match your filters.</p>
        )}

        {!isLoading && !loadError && filteredUsers.length > 0 && (
          <>
            <ul className="admin-user-list">
              {filteredUsers.map((user) => {
                const handlers = getUserHandlers(user);

                return (
                  <li key={user.id}>
                    <AdminUserCard user={user} {...handlers} />
                  </li>
                );
              })}
            </ul>

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
                  {filteredUsers.map((user) => {
                    const handlers = getUserHandlers(user);

                    return (
                      <tr
                        key={user.id}
                        className={
                          user.isSuspended ? "admin-table-row--suspended" : ""
                        }
                      >
                        <td>
                          <div className="admin-user-cell">
                            <strong>
                              {capitalizeFirstLetter(user.username)}
                            </strong>
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
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
