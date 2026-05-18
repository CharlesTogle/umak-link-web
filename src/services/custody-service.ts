import { api } from "@/lib/api";
import type { ApiCustodyHistoryResponse } from "@/types/post-record-api";

function sortCustodyHistoryEntries(
  entries: ApiCustodyHistoryResponse["history"]
): ApiCustodyHistoryResponse["history"] {
  return entries
    .map((entry, index) => ({
      entry,
      index,
      occurredAtMs: Date.parse(entry.occurred_at),
    }))
    .sort((left, right) => {
      const leftTime = Number.isNaN(left.occurredAtMs)
        ? Number.MAX_SAFE_INTEGER
        : left.occurredAtMs;
      const rightTime = Number.isNaN(right.occurredAtMs)
        ? Number.MAX_SAFE_INTEGER
        : right.occurredAtMs;

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.index - right.index;
    })
    .map(({ entry }) => entry);
}

export async function getPostCustodyHistory(postId: string): Promise<ApiCustodyHistoryResponse> {
  const { data } = await api.get<ApiCustodyHistoryResponse>(`/custody/posts/${postId}/history`);
  return {
    ...data,
    history: sortCustodyHistoryEntries(data.history),
  };
}
