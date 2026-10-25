import { Bell, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { managementTypes } from "../data/organisationData";
import { useAuthStore } from "../store/authStore";
import Sidebar from "./Sidebar";

const Header = () => {
  const [open, setOpen] = useState(false);
  const { organisation } = useParams();
  const workspace = managementTypes.find((item) => item.id === organisation);
  const user = useAuthStore((state) => state.user);
  return (
    <header className="sticky top-0 right-0 z-20 border border-(--glass-border) bg-(--glass-bg)/50 backdrop-blur-xl  shadow-[0_8px_20px_var(--shadow-xl)] transition-all duration-300 flex justify-between items-center">
      <button
        className="rounded-lg p-2 text-(--text-secondary) hover:bg-(--surface-hover) lg:hidden"
        onClick={() => setOpen(!open)}
      >
        <Menu size={20} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative grid size-9 place-items-center rounded-lg text-(--text-secondary) hover:bg-(--surface-hover)">
          <Bell size={18} />
          <i className="absolute right-2 top-2 size-1.5 rounded-full bg-(--danger)" />
        </button>
        <div className="ml-2 flex items-center gap-2 border-l border-(--border) pl-3">
          <span className="grid size-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {user.name.split(" ")[0].split("")[0]}
            {/* {user?.name?.split(" ")[1].split("")[0]} */}
          </span>
          <div className="hidden text-left sm:block">
            <strong className="block text-xs">{user.name}</strong>
            {/* <small className="text-[10px] text-(--text-secondary)"></small> */}
          </div>
        </div>
      </div>

      {open && (
        <>
          <div
            className="absolute inset-0 h-screen w-full bg-linear-to-br from-[#323232] via-[#212630f2] to-[#303030] backdrop-blur-lg lg:hidden"
            onClick={() => setOpen(false)}
          >
            <div className="absolute left-0 top-0 rounded-lg border border-(--border) bg-(--primary-soft-hover)  text-xs shadow-xl lg:hidden">
              <X size={18} className="absolute top-1/2" />
              <Sidebar />
            </div>
          </div>
        </>
      )}
    </header>
  );
};
export default Header;
