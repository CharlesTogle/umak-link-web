import { api } from "@/lib/api";
import type { ApiCustodyHistoryResponse } from "@/types/post-record-api";

export async function getPostCustodyHistory(postId: string): Promise<ApiCustodyHistoryResponse> {
  const { data } = await api.get<ApiCustodyHistoryResponse>(`/custody/posts/${postId}/history`);
  return data;
}
