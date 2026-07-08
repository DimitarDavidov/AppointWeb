import type { AdminServiceStats, AdminUser } from "../../types/admin";
import { formatRoleLabel, UserRoles, type UserRole } from "../../constants/roles";
import {
  ChevronActionIcon,
  DeleteActionIcon,
  EditActionIcon,
  SuspendActionIcon,
  UnsuspendActionIcon,
} from "./AdminActionIcons";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import { AdminUserStats } from "./AdminUserStats";
import {
  AdminUserServicesBreakdown,
  type AdminServicesState,
} from "./AdminUserServicesBreakdown";

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case UserRoles.Admin:
      return "admin-badge admin-badge--admin";
    case UserRoles.Provider:
      return "admin-badge admin-badge--provider";
    default:
      return "admin-badge admin-badge--role";
  }
}

function formatJoinedDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

interface UserActionButtonsProps {
  user: AdminUser;
  isSelf: boolean;
  layout?: "inline" | "grid";
  onEdit: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onDelete: () => void;
}

export function UserActionButtons({
  user,
  isSelf,
  layout = "inline",
  onEdit,
  onSuspend,
  onUnsuspend,
  onDelete,
}: UserActionButtonsProps) {
  return (
    <div
      className={`admin-actions${layout === "grid" ? " admin-actions--grid" : ""}`}
    >
      <button
        type="button"
        className="admin-btn admin-btn--edit"
        onClick={onEdit}
      >
        <span className="admin-btn-icon">
          <EditActionIcon />
        </span>
        <span className="admin-btn-label">Edit</span>
      </button>

      {user.isSuspended ? (
        <button
          type="button"
          className="admin-btn admin-btn--unsuspend"
          disabled={isSelf}
          title={
            isSelf ? "You cannot change your own account status" : undefined
          }
          onClick={onUnsuspend}
        >
          <span className="admin-btn-icon">
            <UnsuspendActionIcon />
          </span>
          <span className="admin-btn-label">Unsuspend</span>
        </button>
      ) : (
        <button
          type="button"
          className="admin-btn admin-btn--suspend"
          disabled={isSelf}
          title={
            isSelf ? "You cannot change your own account status" : undefined
          }
          onClick={onSuspend}
        >
          <span className="admin-btn-icon">
            <SuspendActionIcon />
          </span>
          <span className="admin-btn-label">Suspend</span>
        </button>
      )}

      <button
        type="button"
        className="admin-btn admin-btn--delete"
        disabled={isSelf}
        title={isSelf ? "You cannot delete your own account here" : undefined}
        onClick={onDelete}
      >
        <span className="admin-btn-icon">
          <DeleteActionIcon />
        </span>
        <span className="admin-btn-label">Delete</span>
      </button>
    </div>
  );
}

interface UserInsightControlsProps {
  user: AdminUser;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function UserInsightControls({
  user,
  isExpanded,
  onToggleExpand,
}: UserInsightControlsProps) {
  const canExpand = user.role === UserRoles.Provider && user.serviceCount > 0;

  if (!canExpand) return null;

  const serviceLabel = user.serviceCount === 1 ? "service" : "services";

  return (
    <div className="admin-insights">
      <button
        type="button"
        className="admin-insight-btn"
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
      >
        <span className="admin-btn-icon">
          <ChevronActionIcon
            className={`admin-chevron${isExpanded ? " admin-chevron--open" : ""}`}
          />
        </span>
        <span>
          {isExpanded
            ? "Hide services"
            : `View ${user.serviceCount} ${serviceLabel}`}
        </span>
      </button>
    </div>
  );
}

interface AdminUserCardProps {
  user: AdminUser;
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

export function AdminUserCard({
  user,
  isSelf,
  isExpanded,
  servicesState,
  isDownloadingCsv,
  downloadingServiceId,
  onEdit,
  onSuspend,
  onUnsuspend,
  onDelete,
  onToggleExpand,
  onDownloadCsv,
  onDownloadServiceCsv,
}: AdminUserCardProps) {
  const displayName = capitalizeFirstLetter(user.username);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <article
      className={`admin-card${user.isSuspended ? " admin-card--suspended" : ""}`}
    >
      <header className="admin-card-header">
        <div className="admin-card-identity">
          <span className="admin-card-avatar" aria-hidden="true">
            {initial}
          </span>
          <div className="admin-card-heading">
            <h2 className="admin-card-name">{displayName}</h2>
            <p className="admin-card-email">{user.email}</p>
            {isSelf && <span className="admin-card-self">Your account</span>}
          </div>
        </div>

        <div className="admin-card-badges">
          <span className={roleBadgeClass(user.role)}>
            {formatRoleLabel(user.role)}
          </span>
          <span
            className={
              user.isSuspended
                ? "admin-badge admin-badge--suspended"
                : "admin-badge admin-badge--active"
            }
          >
            {user.isSuspended ? "Suspended" : "Active"}
          </span>
        </div>
      </header>

      <dl className="admin-card-meta">
        <div className="admin-card-meta-item">
          <dt>Phone</dt>
          <dd>{user.phoneNumber || "Not set"}</dd>
        </div>
        <div className="admin-card-meta-item">
          <dt>Joined</dt>
          <dd>{formatJoinedDate(user.createdAt)}</dd>
        </div>
      </dl>

      <AdminUserStats
        user={user}
        layout="card"
        isDownloadingCsv={isDownloadingCsv}
        onDownloadCsv={onDownloadCsv}
      />

      <UserInsightControls
        user={user}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      {isExpanded && (
        <AdminUserServicesBreakdown
          state={servicesState}
          downloadingServiceId={downloadingServiceId}
          onDownloadServiceCsv={onDownloadServiceCsv}
        />
      )}

      <UserActionButtons
        user={user}
        isSelf={isSelf}
        layout="grid"
        onEdit={onEdit}
        onSuspend={onSuspend}
        onUnsuspend={onUnsuspend}
        onDelete={onDelete}
      />
    </article>
  );
}

export { roleBadgeClass, formatJoinedDate };
