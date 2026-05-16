import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import type {
  GuardDecisionRequest,
  GuardDecisionResponse,
  GuardScanRequest,
  GuardScanResponse,
} from "@/types/guard-custody";

export class GuardCustodyError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "GuardCustodyError";
    this.statusCode = statusCode;
  }
}

function mapGuardCustodyError(error: unknown): GuardCustodyError {
  if (error instanceof GuardCustodyError) {
    return error;
  }

  if (isAxiosError(error)) {
    return new GuardCustodyError(
      getApiErrorMessage(error, {
        context: "action",
        fallback: "Guard custody request failed.",
      }),
      error.response?.status ?? 0
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new GuardCustodyError(error.message, 0);
  }

  return new GuardCustodyError("Guard custody request failed.", 0);
}

export async function scanGuardCustodySession(
  payload: GuardScanRequest
): Promise<GuardScanResponse> {
  try {
    const { data } = await api.post<GuardScanResponse>("/guard/custody/scan", payload);
    return data;
  } catch (error) {
    throw mapGuardCustodyError(error);
  }
}

export async function submitGuardCustodyDecision(
  custodyAttemptId: string,
  payload: GuardDecisionRequest
): Promise<GuardDecisionResponse> {
  try {
    const { data } = await api.post<GuardDecisionResponse>(
      `/guard/custody/attempts/${custodyAttemptId}/decision`,
      payload
    );
    return data;
  } catch (error) {
    throw mapGuardCustodyError(error);
  }
}
