import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen  text-(--text-primary) lg:flex overflow-hidden">
      <Sidebar />

      <div className="min-w-0 flex-1 h-screen relative overflow-auto">
        <Header />
        <main className="mx-auto w-full p-1 sm:p-2 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
