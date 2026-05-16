import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import type {
  CancelClaimVerificationSessionResponse,
  ClaimVerificationSessionStatusResponse,
  CreateClaimVerificationSessionRequest,
  CreateClaimVerificationSessionResponse,
  GuardActiveClaimReviewsResponse,
  ScanClaimVerificationRequest,
  ScanClaimVerificationResponse,
} from "@/types/claim-verification";

function getClaimVerificationErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
        ? error.response.data.message
        : null;

    if (responseMessage) return responseMessage;
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function createClaimVerificationSession(
  payload: CreateClaimVerificationSessionRequest
): Promise<CreateClaimVerificationSessionResponse> {
  try {
    const { data } = await api.post<CreateClaimVerificationSessionResponse>(
      "/claims/verification-sessions",
      payload
    );
    return data;
  } catch (error) {
    throw new Error(
      getClaimVerificationErrorMessage(
        error,
        "Failed to start claim verification session."
      )
    );
  }
}

export async function getClaimVerificationSessionStatus(
  claimVerificationSessionId: string
): Promise<ClaimVerificationSessionStatusResponse> {
  try {
    const { data } = await api.get<ClaimVerificationSessionStatusResponse>(
      `/claims/verification-sessions/${claimVerificationSessionId}/status`
    );
    return data;
  } catch (error) {
    throw new Error(
      getClaimVerificationErrorMessage(
        error,
        "Failed to refresh claim verification session."
      )
    );
  }
}

export async function scanClaimVerificationSession(
  payload: ScanClaimVerificationRequest
): Promise<ScanClaimVerificationResponse> {
  try {
    const { data } = await api.post<ScanClaimVerificationResponse>(
      "/claims/verification-sessions/scan",
      payload
    );
    return data;
  } catch (error) {
    throw new Error(
      getClaimVerificationErrorMessage(
        error,
        "Failed to verify claimer QR."
      )
    );
  }
}

export async function getGuardActiveClaimReviews(): Promise<GuardActiveClaimReviewsResponse> {
  try {
    const { data } = await api.get<GuardActiveClaimReviewsResponse>("/guard/reviews/active");
    return data;
  } catch (error) {
    throw new Error(
      getClaimVerificationErrorMessage(
        error,
        "Failed to load active guard claim reviews."
      )
    );
  }
}

export async function cancelClaimVerificationSession(
  claimVerificationSessionId: string
): Promise<CancelClaimVerificationSessionResponse> {
  try {
    const { data } = await api.post<CancelClaimVerificationSessionResponse>(
      `/claims/verification-sessions/${claimVerificationSessionId}/cancel`
    );
    return data;
  } catch (error) {
    throw new Error(
      getClaimVerificationErrorMessage(
        error,
        "Failed to cancel the claim verification session."
      )
    );
  }
}
