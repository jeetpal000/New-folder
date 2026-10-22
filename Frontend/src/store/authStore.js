import { create } from "zustand";
import { api } from "../services/api";

let authInitialization;

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isError: false,
  error: "",
  setUser: (user) => set({ user, loading: false, isError: false, error: "" }),
  clearUser: () =>
    set({ user: null, loading: false, isError: false, error: "" }),

  initializeAuth: async () => {
    if (authInitialization) return authInitialization;
    if (get().user) return get().user;

    set({ loading: true, isError: false, error: "" });
    authInitialization = (async () => {
      try {
        const response = await api.get("/organisation/me");
        const user = response.data.user;
        set({ user, loading: false, isError: false, error: "" });
        return user;
      } catch (error) {
        const unauthorized = error.response?.status === 401;
        set({
          user: null,
          loading: false,
          isError: !unauthorized,
          error: unauthorized
            ? ""
            : error.response?.data?.message ||
              error.message ||
              "Could not verify your session.",
        });
        return null;
      } finally {
        authInitialization = null;
      }
    })();
    return authInitialization;
  },
}));
