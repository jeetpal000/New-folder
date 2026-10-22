import { BookOpen, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { sidebarConfig } from "../utils/sidebarConfig";
import { useAuthStore } from "../store/authStore";

const Sidebar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const visibleLinks = [
    ...sidebarConfig.common,
    ...sidebarConfig.school.filter(
      (item) =>
        isAdmin ||
        [
          item.permission,
          item.markPermission,
          item.createPermission,
          item.paymentPermission,
        ].some(
          (permission) => permission && user?.permissions?.includes(permission),
        ),
    ),
    ...(isAdmin ? sidebarConfig.admin : []),
    // sidebarConfig.setting,
  ];
  const schoolName = user?.schoolId?.schoolName || "Your school";
  const schoolInitials = schoolName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <aside className="hidden w-62 shrink-0 border-r border-(--border) bg-(--primary-soft)/30 backdrop-blur-xl  p-4 lg:flex lg:flex-col h-screen overflow-auto relative scrollbar-none">
      <div
        className="sticky -top-3 w-full flex items-center gap-2 bg-(--primary-soft-hover)/70 backdrop-blur-xl cursor-pointer hover:bg-(--primary-soft-hover) shadow-2xl rounded"
        onClick={(e) => {
          e.stopPropagation();
          navigate("/");
        }}
      >
        <div className=" flex h-10 w-10 items-center justify-center rounded-md bg-(--primary) text-lg font-bold text-white  shadow-[0_6px_20px_var(--shadow-color)]">
          N
        </div>
        <span className="text-xl font-bold text-(--text)">NexaManage</span>
      </div>

      <div className="my-6 flex items-center gap-2 rounded-xl border border-(--border) p-3">
        <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {schoolInitials}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-xs">{schoolName}</strong>
          <small className="text-[10px] text-(--text-secondary)">
            School workspace
          </small>
        </span>
      </div>
      <span className="mb-2 px-3 text-[10px] font-bold tracking-widest text-(--text-muted)">
        WORKSPACE
      </span>
      <nav className="grid gap-1">
        {visibleLinks.map((item) => {
          if (item.type === "section") {
            return (
              <div
                key={item.label}
                className="px-3 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-(--text-muted)"
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`${item.path}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-(--primary-soft-hover) hover:text-(--background)  transition-transform duration-300  ${isActive ? "bg-(--primary-soft-hover) text-(--background) font-semibold" : "hover:-translate-y-1"}`
              }
            >
              <Icon size={17} className="font-bold" />
              {item.label}
            </NavLink>
          );
        })}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-(--primary-soft-hover) hover:text-(--background)  transition-transform duration-300  ${isActive ? "bg-(--primary-soft-hover) text-(--background) font-semibold" : "hover:-translate-y-1"}`
          }
        >
          <Settings size={17} className="font-bold " />
          Settings
        </NavLink>
      </nav>

      <div className="mt-auto rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
        <BookOpen size={18} className="text-[var(--primary)]" />
        <strong className="mt-2 block text-xs">Need a hand?</strong>
        <p className="mt-1 text-[10px] leading-4 text-[var(--text-secondary)]">
          Visit the help center for quick answers.
        </p>
        <button className="mt-3 text-[11px] font-bold text-[var(--primary)]">
          Open help center →
        </button>
      </div>
      {signOutError && (
        <p role="alert" className="mt-3 text-xs text-(--danger)">
          {signOutError}
        </p>
      )}
      <button
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          setSignOutError("");
          try {
            await api.post("/logout");
            clearUser();
            navigate("/login", { replace: true });
          } catch (error) {
            setSignOutError(
              error.response?.data?.message || "Could not sign out. Try again.",
            );
          } finally {
            setSigningOut(false);
          }
        }}
        className="mt-4 flex items-center gap-3 px-3 py-2 text-sm text-(--text-secondary) hover:text-(--danger) disabled:opacity-60"
      >
        <LogOut size={17} />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </aside>
  );
};
export default Sidebar;
