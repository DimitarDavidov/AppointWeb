import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "../../constants/roles";
import { useAppSelector } from "../../store/hooks";

interface ProtectedRouteProps {
  roles?: readonly UserRole[];
}

function hasRequiredRole(
  userRole: string | null,
  requiredRoles: readonly UserRole[] | undefined
): boolean {
  if (!requiredRoles?.length) return true;
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
}

function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const location = useLocation();
  const { accessToken, role } = useAppSelector((state) => state.auth);

  if (!accessToken) {
    return (
      <Navigate to="/login" state={{ from: location.pathname }} replace />
    );
  }

  if (!hasRequiredRole(role, roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
