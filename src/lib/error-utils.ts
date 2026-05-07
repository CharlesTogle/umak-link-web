import { isAxiosError } from "axios";

function getResponseMessage(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("message" in data)) return null;

  const message = (data as { message?: unknown }).message;
  return typeof message === "string" && message.trim().length > 0 ? message : null;
}

export function getLoggableErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const responseMessage = getResponseMessage(error.response?.data);
    if (responseMessage) return responseMessage;
    if (typeof error.message === "string" && error.message.trim().length > 0) return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;

  return "Unknown error";
}

export function logError(context: string, error: unknown): void {
  console.error(context, getLoggableErrorMessage(error));
}
