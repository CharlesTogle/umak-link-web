import { create } from "zustand";
import { PORTAL_LOGIN_REJECTION_MESSAGE, isPortalLoginAllowedUserType } from "@/lib/portal-auth";
import { clearStoredToken } from "@/lib/token-storage";
import { supabase } from "@/lib/supabase";
import type { AuthStatus, AuthUser, PortalUserType } from "@/types/auth";
import { fetchCurrentUser, getAuthErrorMessage, isUnauthorizedError } from "@/services/auth-service";

interface AuthStore {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  hasFetched: boolean;
  rejectedUserType: PortalUserType | null;
  hydrateUser: (force?: boolean) => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  clearSession: () => void;
}

const initialState = {
  user: null,
  status: "idle" as AuthStatus,
  error: null,
  hasFetched: false,
  rejectedUserType: null as PortalUserType | null,
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
        rejectedUserType: null,
      });
      return;
    }

    set({ status: "loading", error: null, rejectedUserType: null });
    try {
      const user = await fetchCurrentUser();

      if (!isPortalLoginAllowedUserType(user.user_type)) {
        clearStoredToken();
        if (supabase) {
          await supabase.auth.signOut();
        }

        set({
          user: null,
          status: "error",
          error: PORTAL_LOGIN_REJECTION_MESSAGE,
          hasFetched: true,
          rejectedUserType: user.user_type,
        });
        return;
      }

      set({
        user,
        status: "ready",
        error: null,
        hasFetched: true,
        rejectedUserType: null,
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
        rejectedUserType: null,
      });
    }
  },

  setAuthenticatedUser: (user) =>
    set({
      user,
      status: "ready",
      error: null,
      hasFetched: true,
      rejectedUserType: null,
    }),

  clearSession: () => {
    clearStoredToken();
    if (supabase) {
      void supabase.auth.signOut();
    }
    set({
      ...initialState,
      hasFetched: true,
    });
  },
}));
