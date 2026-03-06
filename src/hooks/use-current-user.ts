"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const hasFetched = useAuthStore((state) => state.hasFetched);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  return {
    user,
    status,
    error,
    isLoading: status === "loading" || (status === "idle" && !hasFetched),
  };
}
