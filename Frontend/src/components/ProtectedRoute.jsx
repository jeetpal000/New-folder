import { useEffect, useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

const ProtectedRoute = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    initializeAuth().finally(() => {
      if (mounted) setHasChecked(true);
    });
    return () => {
      mounted = false;
    };
  }, [initializeAuth]);
  const { user, loading, isError, error } = useAuthStore();

  if (loading || !hasChecked) {
    return (
      <div className="grid min-h-screen place-items-center text-(--text-secondary)">
        Loading.....
      </div>
    );
  }

  if (isError) {
    return (
      <main className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="text-(--danger)" role="alert">
            {error || "Could not verify your session."}
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-(--primary) px-4 py-2 font-semibold text-white"
            onClick={() => {
              setHasChecked(false);
              initializeAuth().finally(() => setHasChecked(true));
            }}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
