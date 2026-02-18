import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuthStore } from '@/store/authStore';
import { APP_CONSTANTS } from '@/constants';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.role === role);
    if (!hasRequiredRole) {
      return <Redirect to="/unauthorized" />;
    }
  }

  if (requiredPermissions.length > 0 && user) {
    const hasRequiredPermission = requiredPermissions.every(
      permission => user.permissions?.includes(permission)
    );
    if (!hasRequiredPermission) {
      return <Redirect to="/unauthorized" />;
    }
  }

  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRoles={[APP_CONSTANTS.ROLES.ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const ManagerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRoles={[APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.MANAGER]}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
