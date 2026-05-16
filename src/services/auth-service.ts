import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { AuthMeResponse, AuthUser } from "@/types/auth";

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthMeResponse>("/auth/me");
  return response.data.user;
}

export async function syncProfilePictureFromGoogle(googleIdToken: string): Promise<AuthUser | null> {
  const response = await api.post<{ user?: AuthUser }>("/auth/update-picture-from-google", {
    googleIdToken,
  });

  return response.data.user ?? null;
}

export function isUnauthorizedError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

export function getAuthErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, {
    context: "auth",
    fallback: "Unable to load your account details.",
  });
}
