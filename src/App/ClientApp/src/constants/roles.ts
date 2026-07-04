export const UserRoles = {
  Customer: "Customer",
  Provider: "Provider",
  Admin: "Admin",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export function formatRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case UserRoles.Provider:
      return "Provider";
    case UserRoles.Admin:
      return "Admin";
    case UserRoles.Customer:
    default:
      return "Customer";
  }
}
