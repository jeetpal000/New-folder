import { create } from "zustand";
import { api } from "../services/api";

let authInitialization;
let authRequestVersion = 0;

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isError: false,
  error: "",
  setUser: (user) => set({ user, loading: false, isError: false, error: "" }),
  clearUser: () =>
    set({ user: null, loading: false, isError: false, error: "" }),

  initializeAuth: async ({ force = false } = {}) => {
    if (force) {
      authRequestVersion += 1;
      authInitialization = null;
    }
    if (authInitialization) return authInitialization;
    if (!force && get().user) return get().user;

    const requestVersion = ++authRequestVersion;
    set({ loading: true, isError: false, error: "" });
    const initialization = (async () => {
      try {
        const response = await api.get("/organisation/me");
        const user = response.data.user;
        if (requestVersion === authRequestVersion) {
          set({ user, loading: false, isError: false, error: "" });
        }
        return user;
      } catch (error) {
        const unauthorized = error.response?.status === 401;
        if (requestVersion === authRequestVersion) {
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
        }
        return null;
      } finally {
        if (authInitialization === initialization) authInitialization = null;
      }
    })();
    authInitialization = initialization;
    return initialization;
  },
}));
