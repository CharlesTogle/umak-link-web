"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isApiNotFoundError } from "@/lib/api-errors";
import { mapPostToCompact, mapPostToRecord } from "@/lib/post-mappers";
import { extractSharedPostRecordId } from "@/lib/post-record-link";
import { getPostCustodyHistory } from "@/services/custody-service";
import { countPosts, getPostByItemDetails, getPostByItemId, getPostFull, listPosts } from "@/services/posts-service";
import { fetchUnreadNotificationsCount } from "@/services/notifications-service";
import type { ApiCustodyHistoryResponse, ApiPostRecordDetails } from "@/types/post-record-api";
import type { DashboardPostsParams, PostRecordsParams } from "@/types/post-query";
import { normalizeValue } from "@/lib/format-utils";

export const POSTS_PAGE_SIZE = 10;
const NUMERIC_POST_ID_PATTERN = /^\d+$/;
const LOST_POST_NOT_FOUND_MESSAGE =
  "Lost post not found. Paste a shared post link or enter a valid Item ID.";
const LOST_POST_INVALID_REFERENCE_MESSAGE =
  "The reference must point to a missing/lost item post.";
const LOST_POST_DISCARDED_MESSAGE =
  "This item cannot be linked because it was discarded.";
const LOST_POST_RETURNED_MESSAGE =
  "This item has already been returned and cannot be linked.";
const LOST_POST_INVALID_STATUS_MESSAGE =
  "This post cannot be linked unless it is pending or accepted.";

export const postKeys = {
  dashboard: (params: DashboardPostsParams) => ["posts", "dashboard", params] as const,
  dashboardStats: ["posts", "dashboard-stats"] as const,
  records: (params: PostRecordsParams) => ["posts", "records", params] as const,
  detail: (postId: string) => ["posts", "detail", postId] as const,
  custodyHistory: (postId: string) => ["posts", "custody-history", postId] as const,
  linked: (postId: string, record: ApiPostRecordDetails | null) =>
    [
      "posts",
      "linked",
      postId,
      record?.item_id ?? null,
      record?.item_type ?? null,
      record?.item_status ?? null,
      record?.linked_lost_item_id ?? null,
    ] as const,
  lostItem: (itemId: string) => ["posts", "lost-item", itemId] as const,
};

function getNextExcludedPostIds<T extends { postId: string }>(
  pages: T[][],
  pageSize: number
): string[] | undefined {
  const lastPage = pages[pages.length - 1];
  if (!lastPage || lastPage.length < pageSize) return undefined;
  return pages.flat().map((page) => page.postId);
}

export function useDashboardPosts(params: DashboardPostsParams) {
  const pageSize = params.pageSize ?? POSTS_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: postKeys.dashboard({ ...params, pageSize }),
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const response = await listPosts({
        ...(params.itemType ? { item_type: params.itemType } : {}),
        ...(params.postStatus ? { status: params.postStatus } : {}),
        ...(pageParam.length > 0 ? { exclude_ids: pageParam } : {}),
        limit: pageSize,
        order_by: "submission_date",
        order_direction: "desc",
      });

      return response.posts.map(mapPostToCompact);
    },
    getNextPageParam: (_lastPage, allPages) =>
      getNextExcludedPostIds(allPages, pageSize),
  });
}

export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: postKeys.dashboardStats,
    queryFn: async () => {
      const [pending, fraud, unread] = await Promise.all([
        countPosts({ status: "pending" }),
        countPosts({ status: "fraud" }),
        fetchUnreadNotificationsCount(),
      ]);

      return {
        pendingClaims: pending.count,
        fraudReports: fraud.count,
        unreadAlerts: unread.unread_count,
      };
    },
    enabled,
  });
}

export function usePostRecords(params: PostRecordsParams) {
  const pageSize = params.pageSize ?? POSTS_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: postKeys.records({ ...params, pageSize }),
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const response = await listPosts({
        ...(params.itemType ? { item_type: params.itemType } : {}),
        ...(params.postStatus ? { status: params.postStatus } : {}),
        ...(params.itemStatus ? { item_status: params.itemStatus } : {}),
        ...(params.custodyStatus ? { custody_status: params.custodyStatus } : {}),
        ...(pageParam.length > 0 ? { exclude_ids: pageParam } : {}),
        limit: pageSize,
        order_by: "submission_date",
        order_direction: params.sortDirection ?? "desc",
      });

      return response.posts.map(mapPostToRecord);
    },
    getNextPageParam: (_lastPage, allPages) =>
      getNextExcludedPostIds(allPages, pageSize),
  });
}

export function flattenInfinitePages<T>(pages: T[][] | undefined): T[] {
  return pages?.flat() ?? [];
}

export function usePostDetail(postId: string) {
  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => getPostFull(postId),
    enabled: Boolean(postId),
  });
}

export function usePostCustodyHistory(postId: string, enabled = true) {
  return useQuery<ApiCustodyHistoryResponse>({
    queryKey: postKeys.custodyHistory(postId),
    queryFn: () => getPostCustodyHistory(postId),
    enabled: Boolean(postId) && enabled,
  });
}

export function useLinkedPost(record: ApiPostRecordDetails | null, postId: string) {
  return useQuery({
    queryKey: postKeys.linked(postId, record),
    enabled: Boolean(record),
    queryFn: async () => {
      if (!record) return null;

      const itemType = normalizeValue(record.item_type);
      const itemStatus = normalizeValue(record.item_status);

      if (itemType === "found" && record.linked_lost_item_id) {
        return getPostByItemDetails(record.linked_lost_item_id);
      }

      if (itemType === "missing" && itemStatus === "returned" && record.item_id) {
        const linkedFoundPosts = await listPosts({ linked_item_id: record.item_id, limit: 1 });
        return linkedFoundPosts.posts[0] ?? null;
      }

      if (itemType === "missing" && itemStatus === "claimed" && record.item_id) {
        return getPostByItemId(record.item_id);
      }

      return null;
    },
  });
}

export function useLostItemLookup(itemId: string) {
  const trimmedItemId = itemId.trim();

  return useQuery({
    queryKey: postKeys.lostItem(trimmedItemId),
    enabled: Boolean(trimmedItemId),
    queryFn: async () => {
      const validateLostPost = (lostPost: ApiPostRecordDetails) => {
        if (normalizeValue(lostPost.item_type) !== "missing") {
          throw new Error(LOST_POST_INVALID_REFERENCE_MESSAGE);
        }

        const normalizedLostPostItemStatus = normalizeValue(lostPost.item_status);
        const normalizedLostPostStatus = normalizeValue(lostPost.post_status);

        if (normalizedLostPostItemStatus === "discarded") {
          throw new Error(LOST_POST_DISCARDED_MESSAGE);
        }

        if (normalizedLostPostItemStatus === "returned") {
          throw new Error(LOST_POST_RETURNED_MESSAGE);
        }

        if (
          normalizedLostPostStatus !== "accepted" &&
          normalizedLostPostStatus !== "pending"
        ) {
          throw new Error(LOST_POST_INVALID_STATUS_MESSAGE);
        }

        return lostPost;
      };

      const sharedPostId = extractSharedPostRecordId(trimmedItemId);

      if (sharedPostId) {
        try {
          return validateLostPost(await getPostFull(sharedPostId));
        } catch (error) {
          if (isApiNotFoundError(error)) {
            throw new Error(LOST_POST_NOT_FOUND_MESSAGE);
          }

          throw error;
        }
      }

      if (NUMERIC_POST_ID_PATTERN.test(trimmedItemId)) {
        try {
          return validateLostPost(await getPostFull(trimmedItemId));
        } catch (error) {
          if (!isApiNotFoundError(error)) {
            throw error;
          }
        }
      }

      try {
        return validateLostPost(await getPostByItemDetails(trimmedItemId));
      } catch (error) {
        if (isApiNotFoundError(error)) {
          throw new Error(LOST_POST_NOT_FOUND_MESSAGE);
        }

        throw error;
      }
    },
  });
}
