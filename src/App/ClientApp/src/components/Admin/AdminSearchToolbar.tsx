import { UserRoles, type UserRole } from "../../constants/roles";

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

export type RoleFilter = "all" | UserRole;
export type StatusFilter = "all" | "active" | "suspended";

interface AdminSearchToolbarProps {
  searchQuery: string;
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: RoleFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}

export function AdminSearchToolbar({
  searchQuery,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
}: AdminSearchToolbarProps) {
  return (
    <div className="admin-toolbar">
      <label className="admin-search" htmlFor="admin-user-search">
        <SearchIcon />
        <input
          id="admin-user-search"
          type="search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </label>

      <div className="admin-filters">
        <select
          className="admin-filter"
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
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
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
    </div>
  );
}
