import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteAdminUser,
  getAdminServiceCancelledAppointments,
  getAdminUserCancelledAppointments,
  getAdminUsers,
  getAdminUserServices,
  suspendAdminUser,
  unsuspendAdminUser,
  updateAdminUser,
} from "../api/admin";
import { getErrorMessage } from "../api/errors";
import type { AdminServicesState } from "../components/Admin/AdminUserServicesBreakdown";
import {
  buildCancelledAppointmentsCsv,
  downloadCsv,
  sanitizeFilename,
} from "../utils/csvExport";
import { AdminSearchToolbar } from "../components/Admin/AdminSearchToolbar";
import type {
  RoleFilter,
  StatusFilter,
} from "../components/Admin/AdminSearchToolbar";
import { AdminStatsGrid } from "../components/Admin/AdminStatsGrid";
import { AdminUserActionDialog } from "../components/Admin/AdminUserActionDialog";
import { AdminUserCard } from "../components/Admin/AdminUserCard";
import type { AdminUserHandlers } from "../components/Admin/AdminUserTable";
import { AdminUserTable } from "../components/Admin/AdminUserTable";
import EditUserModal from "../components/Admin/EditUserModal";
import {
  matchesSearch,
  type DialogAction,
} from "../components/Admin/adminPanelUtils";
import { SpinnerIcon } from "../components/Account/AccountIcons";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAppSelector } from "../store/hooks";
import type {
  AdminServiceStats,
  AdminUser,
  UpdateAdminUserRequest,
} from "../types/admin";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import "./AdminPanel.scss";

function AdminPanel() {
  const { userId } = useAppSelector((state) => state.auth);

  const {
    data: users = [],
    setData: setUsers,
    isLoading,
    error: loadError,
  } = useAsyncData(getAdminUsers, [], {
    initialData: [],
    errorMessage: "Could not load users. Please try again.",
  });

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [dialogTarget, setDialogTarget] = useState<AdminUser | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [servicesByUser, setServicesByUser] = useState<
    Record<string, AdminServicesState>
  >({});
  const [downloadingUserId, setDownloadingUserId] = useState<string | null>(
    null
  );
  const [downloadingServiceId, setDownloadingServiceId] = useState<
    string | null
  >(null);

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

  const loadUserServices = useCallback(async (id: string) => {
    setServicesByUser((current) => ({
      ...current,
      [id]: { loading: true, error: "", data: current[id]?.data ?? [] },
    }));

    try {
      const data = await getAdminUserServices(id);
      setServicesByUser((current) => ({
        ...current,
        [id]: { loading: false, error: "", data },
      }));
    } catch (err) {
      setServicesByUser((current) => ({
        ...current,
        [id]: {
          loading: false,
          error: getErrorMessage(err, "Could not load services."),
          data: [],
        },
      }));
    }
  }, []);

  const handleToggleExpand = useCallback(
    (user: AdminUser) => {
      setExpandedUserId((current) => {
        if (current === user.id) return null;

        const cached = servicesByUser[user.id];
        if (!cached || (cached.error && !cached.loading)) {
          void loadUserServices(user.id);
        }

        return user.id;
      });
    },
    [servicesByUser, loadUserServices]
  );

  const handleDownloadCsv = useCallback(async (user: AdminUser) => {
    setDownloadingUserId(user.id);

    try {
      const appointments = await getAdminUserCancelledAppointments(user.id);

      if (appointments.length === 0) {
        setMessage(
          `${capitalizeFirstLetter(user.username)} has no cancelled appointments.`
        );
        return;
      }

      const csv = buildCancelledAppointmentsCsv(appointments);
      downloadCsv(
        `cancelled-appointments-${sanitizeFilename(user.username)}.csv`,
        csv
      );
      setMessage(
        `Exported ${appointments.length} cancelled appointment${
          appointments.length === 1 ? "" : "s"
        } for ${capitalizeFirstLetter(user.username)}.`
      );
    } catch (err) {
      setMessage(getErrorMessage(err, "Could not export cancelled appointments."));
    } finally {
      setDownloadingUserId(null);
    }
  }, []);

  const handleDownloadServiceCsv = useCallback(
    async (user: AdminUser, service: AdminServiceStats) => {
      setDownloadingServiceId(service.serviceId);

      try {
        const appointments = await getAdminServiceCancelledAppointments(
          user.id,
          service.serviceId
        );

        if (appointments.length === 0) {
          setMessage(
            `${service.serviceName} has no cancelled appointments.`
          );
          return;
        }

        const csv = buildCancelledAppointmentsCsv(appointments);
        downloadCsv(
          `cancelled-${sanitizeFilename(service.serviceName)}-${sanitizeFilename(
            user.username
          )}.csv`,
          csv
        );
        setMessage(
          `Exported ${appointments.length} cancelled appointment${
            appointments.length === 1 ? "" : "s"
          } for ${service.serviceName}.`
        );
      } catch (err) {
        setMessage(
          getErrorMessage(err, "Could not export cancelled appointments.")
        );
      } finally {
        setDownloadingServiceId(null);
      }
    },
    []
  );

  function getUserHandlers(user: AdminUser): AdminUserHandlers {
    const isSelf = userId === user.id;

    return {
      isSelf,
      isExpanded: expandedUserId === user.id,
      servicesState: servicesByUser[user.id],
      isDownloadingCsv: downloadingUserId === user.id,
      downloadingServiceId,
      onEdit: () => {
        setEditError("");
        setEditingUser(user);
      },
      onSuspend: () => {
        setDialogAction("suspend");
        setDialogTarget(user);
        setDialogError("");
      },
      onUnsuspend: () => {
        setDialogAction("unsuspend");
        setDialogTarget(user);
        setDialogError("");
      },
      onDelete: () => {
        setDialogAction("delete");
        setDialogTarget(user);
        setDialogError("");
      },
      onToggleExpand: () => handleToggleExpand(user),
      onDownloadCsv: () => void handleDownloadCsv(user),
      onDownloadServiceCsv: (service: AdminServiceStats) =>
        void handleDownloadServiceCsv(user, service),
    };
  }

  function closeDialog() {
    if (isDialogSubmitting) return;
    setDialogAction(null);
    setDialogTarget(null);
    setDialogError("");
  }

  async function handleSaveEdit(id: string, data: UpdateAdminUserRequest) {
    setIsSavingEdit(true);
    setEditError("");

    try {
      const updated = await updateAdminUser(id, data);
      setUsers((current = []) =>
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
        setUsers((current = []) =>
          current.filter((user) => user.id !== dialogTarget.id)
        );
        setMessage(`Deleted ${capitalizeFirstLetter(dialogTarget.username)}.`);
      } else if (dialogAction === "suspend") {
        const updated = await suspendAdminUser(dialogTarget.id);
        setUsers((current = []) =>
          current.map((user) => (user.id === updated.id ? updated : user))
        );
        setMessage(`Suspended ${capitalizeFirstLetter(updated.username)}.`);
      } else if (dialogAction === "unsuspend") {
        const updated = await unsuspendAdminUser(dialogTarget.id);
        setUsers((current = []) =>
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

      <AdminUserActionDialog
        action={dialogAction}
        target={dialogTarget}
        error={dialogError}
        isSubmitting={isDialogSubmitting}
        onConfirm={handleConfirmDialog}
        onClose={closeDialog}
      />

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

        <AdminStatsGrid
          total={counts.total}
          active={counts.active}
          suspended={counts.suspended}
        />

        <AdminSearchToolbar
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
        />

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
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <AdminUserCard user={user} {...getUserHandlers(user)} />
                </li>
              ))}
            </ul>

            <AdminUserTable
              users={filteredUsers}
              getUserHandlers={getUserHandlers}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
