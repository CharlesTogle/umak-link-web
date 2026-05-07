import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import type {
  DeleteClaimResponse,
  ProcessClaimRequest,
  ProcessClaimResponse,
} from "@/types/claims";

function getClaimsErrorMessage(error: unknown, fallback: string): string {
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

export async function processClaimSubmission(
  payload: ProcessClaimRequest
): Promise<ProcessClaimResponse> {
  try {
    const { data } = await api.post<ProcessClaimResponse>("/claims/process", payload);
    return data;
  } catch (error) {
    throw new Error(getClaimsErrorMessage(error, "Failed to process claim"));
  }
}

export async function deleteClaimByItem(itemId: string): Promise<DeleteClaimResponse> {
  try {
    const { data } = await api.delete<DeleteClaimResponse>(`/claims/by-item/${itemId}`);
    return data;
  } catch (error) {
    throw new Error(getClaimsErrorMessage(error, "Failed to delete claim"));
  }
}
