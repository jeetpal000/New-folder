import { useEffect } from "react";
import AdminDashboard from "../../components/AdminDashboard";
import StaffDashboard from "../../components/StaffDashboard";
import { useAuthStore } from "../../store/authStore";

const Dashboard = () => {
  const role = useAuthStore(
    (state) => state.user?.roleId?.role || state.user?.roleId?.name,
  );
  return role === "Admin" ? <AdminDashboard /> : <StaffDashboard />;
};

export default Dashboard;
