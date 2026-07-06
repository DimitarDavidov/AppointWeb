import type { AdminUser } from "../../types/admin";

export function matchesSearch(user: AdminUser, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    user.username.toLowerCase().includes(normalized) ||
    user.email.toLowerCase().includes(normalized) ||
    (user.phoneNumber?.toLowerCase().includes(normalized) ?? false)
  );
}

export type DialogAction = "suspend" | "unsuspend" | "delete" | null;

export function getDialogConfig(action: DialogAction) {
  switch (action) {
    case "delete":
      return { title: "Delete user account?", confirmLabel: "Delete account" };
    case "suspend":
      return { title: "Suspend user?", confirmLabel: "Suspend user" };
    case "unsuspend":
      return { title: "Reactivate user?", confirmLabel: "Reactivate user" };
    default:
      return { title: "", confirmLabel: "Confirm" };
  }
}
