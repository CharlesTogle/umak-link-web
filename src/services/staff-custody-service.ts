import { api } from "@/lib/api";
import type {
  ApiEditablePostCustodyStatus,
  ApiNotifyGuardResponse,
  ApiOpenCustodyInvestigationResponse,
  ApiSecurityOfficeReceiptResponse,
  ApiUpdatePostCustodyStatusResponse,
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

export async function updatePostCustodyStatus(
  postId: number,
  custodyStatus: ApiEditablePostCustodyStatus
): Promise<ApiUpdatePostCustodyStatusResponse> {
  const { data } = await api.put<ApiUpdatePostCustodyStatusResponse>(
    "/staff/custody/status",
    {
      post_id: postId,
      custody_status: custodyStatus,
    }
  );
  return data;
}
