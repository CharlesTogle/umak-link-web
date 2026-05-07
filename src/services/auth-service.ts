import { isAxiosError } from "axios";
import { api } from "@/lib/api";
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
  if (isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
        ? error.response.data.message
        : null;

    if (responseMessage) return responseMessage;
    if (typeof error.message === "string" && error.message.trim()) return error.message;
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unable to load your account details.";
}
