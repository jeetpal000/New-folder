import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const PermissionRoute = ({ permission, adminOnly = false, children }) => {
  const user = useAuthStore((state) => state.user);
  const role = user?.roleId?.role || user?.roleId?.name;
  const isAdmin = role === "Admin";

  if (adminOnly) {
    return isAdmin ? children : <Navigate to="/dashboard" replace />;
  }

  const requiredPermissions = Array.isArray(permission)
    ? permission
    : [permission];
  if (
    isAdmin ||
    requiredPermissions.some((key) => user?.permissions?.includes(key))
  ) {
    return children;
  }

  return <Navigate to="/dashboard" replace />;
};

export default PermissionRoute;
