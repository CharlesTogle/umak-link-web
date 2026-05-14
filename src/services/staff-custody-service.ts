import { api } from "@/lib/api";
import type {
  ApiEditableClaimedCustodyStatus,
  ApiNotifyGuardResponse,
  ApiOpenCustodyInvestigationResponse,
  ApiSecurityOfficeReceiptResponse,
  ApiUpdateClaimedCustodyStatusResponse,
} from "@/types/post-record-api";

export async function markPostReceivedInSecurityOffice(postId: number): Promise<ApiSecurityOfficeReceiptResponse> {
  const { data } = await api.post<ApiSecurityOfficeReceiptResponse>(
    "/staff/custody/security-office/receive",
    { post_id: postId }
  );
  return data;
}

export async function openPostCustodyInvestigation(postId: number): Promise<ApiOpenCustodyInvestigationResponse> {
  const { data } = await api.post<ApiOpenCustodyInvestigationResponse>(
    "/staff/custody/investigations/open",
    { post_id: postId }
  );
  return data;
}

export async function notifyGuardForCustodyFollowUp(postId: number): Promise<ApiNotifyGuardResponse> {
  const { data } = await api.post<ApiNotifyGuardResponse>(
    "/staff/custody/guards/notify",
    { post_id: postId }
  );
  return data;
}

export async function updateClaimedItemCustodyStatus(
  postId: number,
  custodyStatus: ApiEditableClaimedCustodyStatus
): Promise<ApiUpdateClaimedCustodyStatusResponse> {
  const { data } = await api.put<ApiUpdateClaimedCustodyStatusResponse>(
    "/staff/custody/status",
    {
      post_id: postId,
      custody_status: custodyStatus,
    }
  );
  return data;
}
