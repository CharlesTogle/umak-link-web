import { isAxiosError, type AxiosError } from "axios";

export type ApiErrorContext = "action" | "page" | "auth";

export interface ApiErrorMetadata {
  statusCode: number;
  error: string;
  code: string;
  message?: string;
  requestId?: string;
  retryAfterSeconds?: number;
}

type AxiosErrorWithMetadata = AxiosError & {
  appError?: ApiErrorMetadata;
};

const DEFAULT_RATE_LIMIT_SECONDS = 5;

const STATUS_ERROR_TITLES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  422: "Validation Failed",
  429: "Rate Limited",
  500: "Internal Server Error",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

const STATUS_ERROR_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "REQUEST_TIMEOUT",
  409: "CONFLICT",
  410: "GONE",
  422: "VALIDATION_FAILED",
  429: "RATE_LIMITED",
  500: "INTERNAL_SERVER_ERROR",
  503: "SERVICE_UNAVAILABLE",
  504: "REQUEST_TIMEOUT",
};

function getStatusErrorTitle(statusCode: number): string {
  return STATUS_ERROR_TITLES[statusCode] ?? "Internal Server Error";
}

function getStatusErrorCode(statusCode: number): string {
  return STATUS_ERROR_CODES[statusCode] ?? "INTERNAL_SERVER_ERROR";
}

function formatRateLimitedMessage(retryAfterSeconds?: number): string {
  const seconds = retryAfterSeconds ?? DEFAULT_RATE_LIMIT_SECONDS;
  return `You are doing this too fast, please wait ${seconds} second${seconds === 1 ? "" : "s"} before doing the next action.`;
}

export function getApiErrorMessageFromMetadata(
  metadata: ApiErrorMetadata,
  context: ApiErrorContext = "action",
  fallback?: string
): string {
  if (metadata.code === "NETWORK_ERROR" || metadata.statusCode === 0) {
    return "Please check your internet connection and try again.";
  }

  if (
    metadata.code === "REQUEST_TIMEOUT" ||
    metadata.statusCode === 408 ||
    metadata.statusCode === 504
  ) {
    return context === "auth"
      ? "Unable to complete sign in. Please try again."
      : "The request took too long. Please try again.";
  }

  if (metadata.code === "RATE_LIMITED" || metadata.statusCode === 429) {
    return formatRateLimitedMessage(metadata.retryAfterSeconds);
  }

  if (metadata.code === "GONE" || metadata.statusCode === 410) {
    return fallback ?? "This session or code already expired. Please start again.";
  }

  if (context === "auth") {
    if (metadata.statusCode === 401 || metadata.statusCode === 403) {
      return "Unable to complete sign in. Please try again.";
    }

    if (metadata.statusCode === 404) {
      return "Page not found.";
    }

    return fallback ?? "Unable to complete sign in. Please try again.";
  }

  if (context === "page") {
    if (metadata.statusCode === 404 || metadata.code === "NOT_FOUND") {
      return "Page not found.";
    }

    if (metadata.statusCode === 403 || metadata.code === "FORBIDDEN") {
      return "You are not allowed to do this action.";
    }

    return "Action didn't succeed, please try again later.";
  }

  if (metadata.statusCode === 401) {
    return "Your session expired. Please sign in again.";
  }

  if (metadata.statusCode === 403) {
    return "You are not allowed to do this action.";
  }

  if (metadata.statusCode === 404 || metadata.code === "NOT_FOUND") {
    return "Page not found.";
  }

  if (metadata.statusCode === 422) {
    return "Some information is invalid. Please review and try again.";
  }

  if (metadata.statusCode === 409) {
    return fallback ?? "This action could not be completed right now.";
  }

  if (metadata.statusCode >= 500) {
    return "Action didn't succeed, please try again later.";
  }

  return fallback ?? "Action didn't succeed, please try again later.";
}

export function extractApiErrorMetadata(error: unknown): ApiErrorMetadata {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosErrorWithMetadata;
    if (axiosError.appError) {
      return axiosError.appError;
    }

    const data =
      typeof axiosError.response?.data === "object" && axiosError.response?.data
        ? (axiosError.response.data as Record<string, unknown>)
        : {};

    const statusCode =
      typeof data.statusCode === "number"
        ? data.statusCode
        : axiosError.code === "ECONNABORTED"
          ? 504
          : axiosError.response?.status ?? 0;

    const retryAfterSeconds =
      typeof data.retryAfterSeconds === "number"
        ? data.retryAfterSeconds
        : axiosError.response?.status === 429
          ? DEFAULT_RATE_LIMIT_SECONDS
          : undefined;

    const metadata: ApiErrorMetadata = {
      statusCode,
      error:
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : getStatusErrorTitle(statusCode),
      code:
        typeof data.code === "string" && data.code.trim().length > 0
          ? data.code
          : axiosError.code === "ECONNABORTED"
            ? "REQUEST_TIMEOUT"
            : statusCode === 0
              ? "NETWORK_ERROR"
              : getStatusErrorCode(statusCode),
    };

    if (typeof data.message === "string" && data.message.trim().length > 0) {
      metadata.message = data.message;
    }

    if (typeof data.requestId === "string" && data.requestId.trim().length > 0) {
      metadata.requestId = data.requestId;
    }

    if (typeof retryAfterSeconds === "number") {
      metadata.retryAfterSeconds = retryAfterSeconds;
    }

    return metadata;
  }

  if (error instanceof Error) {
    return {
      statusCode: 0,
      error: "Internal Server Error",
      code: "UNKNOWN_ERROR",
      message: error.message,
    };
  }

  return {
    statusCode: 0,
    error: "Internal Server Error",
    code: "UNKNOWN_ERROR",
  };
}

export function getApiErrorMessage(
  error: unknown,
  options: { context?: ApiErrorContext; fallback?: string } = {}
): string {
  return getApiErrorMessageFromMetadata(
    extractApiErrorMetadata(error),
    options.context,
    options.fallback
  );
}

export function attachFriendlyApiErrorMessage(
  error: unknown,
  context: ApiErrorContext = "action",
  fallback?: string
): void {
  if (!isAxiosError(error)) return;

  const axiosError = error as AxiosErrorWithMetadata;
  const metadata = extractApiErrorMetadata(axiosError);
  axiosError.appError = metadata;
  axiosError.message = getApiErrorMessageFromMetadata(metadata, context, fallback);
}

export function isApiNotFoundError(error: unknown): boolean {
  const metadata = extractApiErrorMetadata(error);
  return metadata.statusCode === 404 || metadata.code === "NOT_FOUND";
}

export function isApiForbiddenError(error: unknown): boolean {
  const metadata = extractApiErrorMetadata(error);
  return metadata.statusCode === 403 || metadata.code === "FORBIDDEN";
}
