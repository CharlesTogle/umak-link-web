import { isAxiosError } from "axios";
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
  item_status?: string;
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

function isMissingFullPostError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.response?.status === 404) return true;

  const responseMessage =
    typeof error.response?.data === "object" &&
    error.response?.data &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
      ? error.response.data.message
      : null;

  return responseMessage === "Post not found";
}

function mapPostToFallbackDetails(post: ApiPostRecord): ApiPostRecordDetails {
  return {
    post_id: post.post_id,
    poster_id: post.poster_id ?? "",
    post_status: post.post_status ?? "pending",
    item_id: post.item_id ?? "",
    is_anonymous: post.is_anonymous,
    submitted_on_date_local: post.submission_date,
    rejection_reason: null,
    accepted_on_date_local: post.accepted_on_date ?? null,
    last_seen_date: null,
    last_seen_time: null,
    last_seen_at: post.last_seen_at,
    last_seen_location: post.last_seen_location,
    item_name: post.item_name ?? "Untitled item",
    item_description: post.item_description,
    image_id: null,
    item_image_url: post.item_image_url,
    item_status: post.item_status ?? "unclaimed",
    item_type: post.item_type,
    category: post.category,
    custody_status: post.custody_status ?? null,
    poster_name: post.poster_name ?? "Unknown User",
    poster_email: "",
    poster_profile_picture_url:
      post.poster_profile_picture_url ?? post.profile_picture_url ?? null,
    claim_id: post.claim_id ?? null,
    claimer_name: post.claimed_by_name ?? null,
    claimer_school_email: post.claimed_by_email ?? null,
    claimer_contact_num: post.claimed_by_contact ?? null,
    claimed_at: post.claimed_at ?? null,
    claim_processed_by_name: null,
    claim_processed_by_email: null,
    claim_processed_by_profile_picture_url: null,
    linked_lost_item_id: null,
    returned_at: null,
  };
}

export async function getPostFull(postId: string): Promise<ApiPostRecordDetails> {
  try {
    const { data } = await api.get<ApiPostRecordDetails>(`/posts/${postId}/full`);
    return data;
  } catch (error) {
    if (!isMissingFullPostError(error)) throw error;
    const fallbackPost = await getPost(postId);
    return mapPostToFallbackDetails(fallbackPost);
  }
}

export async function getPostByItemId(itemId: string): Promise<ApiPostRecord> {
  const { data } = await api.get<ApiPostRecord>(`/posts/by-item/${itemId}`);
  return data;
}

export async function getPostByItemDetails(itemId: string): Promise<ApiPostRecordDetails> {
  const { data } = await api.get<ApiPostRecordDetails>(`/posts/by-item-details/${itemId}`);
  return data;
}
