import { create } from "zustand";
import { clearStoredToken, getStoredToken, getStoredTokenRole } from "@/lib/token-storage";
import type { AuthUser } from "@/types/auth";
import { fetchCurrentUser, getAuthErrorMessage, isUnauthorizedError } from "@/services/auth-service";

type AuthStatus = "idle" | "loading" | "ready" | "error";

interface AuthStore {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  hasFetched: boolean;
  hydrateUser: (force?: boolean) => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  clearSession: () => void;
}

const initialState = {
  user: null,
  status: "idle" as AuthStatus,
  error: null,
  hasFetched: false,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  hydrateUser: async (force = false) => {
    const { status, hasFetched } = get();
    if (!force && (status === "loading" || hasFetched)) return;

    const token = getStoredToken();
    if (!token) {
      set({
        user: null,
        status: "idle",
        error: null,
        hasFetched: true,
      });
      return;
    }

    set({ status: "loading", error: null });
    try {
      const user = await fetchCurrentUser();
      const tokenRole = getStoredTokenRole();
      const resolvedUser =
        user.user_type === "User" && tokenRole
          ? { ...user, user_type: tokenRole }
          : user;

      set({
        user: resolvedUser,
        status: "ready",
        error: null,
        hasFetched: true,
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearStoredToken();
      }

      set({
        user: null,
        status: "error",
        error: getAuthErrorMessage(error),
        hasFetched: true,
      });
    }
  },

  setAuthenticatedUser: (user) =>
    set({
      user,
      status: "ready",
      error: null,
      hasFetched: true,
    }),

  clearSession: () => {
    clearStoredToken();
    set(initialState);
  },
}));
