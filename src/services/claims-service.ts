import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import type {
  DeleteClaimResponse,
  ProcessClaimRequest,
  ProcessClaimResponse,
} from "@/types/claims";

function getClaimsErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, { context: "action", fallback });
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
