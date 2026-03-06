import { api } from "@/lib/api";
import type {
  ApiItemStatus,
  ApiPostListResponse,
  ApiPostRecord,
  ApiPostRecordDetails,
  ApiPostStatus,
} from "@/types/post-record-api";

interface ListPostsParams {
  type?: "public" | "pending" | "staff" | "own";
  item_type?: "found" | "missing";
  status?: string;
  poster_id?: string;
  item_id?: string;
  linked_item_id?: string;
  post_ids?: string[];
  exclude_ids?: string[];
  limit?: number;
  offset?: number;
  include_count?: boolean;
  order_by?: "submission_date" | "accepted_on_date";
  order_direction?: "asc" | "desc";
}

export async function listPosts(params: ListPostsParams): Promise<ApiPostListResponse> {
  const { data } = await api.get<ApiPostListResponse>("/posts", {
    params: {
      ...params,
      post_ids: params.post_ids?.join(","),
      exclude_ids: params.exclude_ids?.join(","),
      include_count: params.include_count ? "true" : undefined,
    },
  });
  return data;
}

export async function countPosts(params: {
  type?: "public" | "pending" | "staff" | "own";
  item_type?: "found" | "missing";
  status?: string;
  poster_id?: string;
}): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>("/posts/count", { params });
  return data;
}

export async function updatePostStatus(
  postId: string,
  payload: { status: ApiPostStatus; rejection_reason?: string }
): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/posts/${postId}/status`, payload);
  return data;
}

export async function updateItemStatus(
  itemId: string,
  payload: { status: ApiItemStatus }
): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/posts/items/${itemId}/status`, payload);
  return data;
}

export async function getPost(postId: string): Promise<ApiPostRecord> {
  const { data } = await api.get<ApiPostRecord>(`/posts/${postId}`);
  return data;
}

export async function getPostFull(postId: string): Promise<ApiPostRecordDetails> {
  const { data } = await api.get<ApiPostRecordDetails>(`/posts/${postId}/full`);
  return data;
}

export async function getPostByItemId(itemId: string): Promise<ApiPostRecord> {
  const { data } = await api.get<ApiPostRecord>(`/posts/by-item/${itemId}`);
  return data;
}

export async function getPostByItemDetails(itemId: string): Promise<ApiPostRecordDetails> {
  const { data } = await api.get<ApiPostRecordDetails>(`/posts/by-item-details/${itemId}`);
  return data;
}
