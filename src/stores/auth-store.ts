import { create } from "zustand";
import { clearStoredToken } from "@/lib/token-storage";
import { supabase } from "@/lib/supabase";
import type { AuthStatus, AuthUser } from "@/types/auth";
import { fetchCurrentUser, getAuthErrorMessage, isUnauthorizedError } from "@/services/auth-service";

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

    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const token = session?.access_token ?? null;
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

      set({
        user,
        status: "ready",
        error: null,
        hasFetched: true,
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearStoredToken();
        if (supabase) {
          await supabase.auth.signOut();
        }
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
    if (supabase) {
      void supabase.auth.signOut();
    }
    set(initialState);
  },
}));
