"use client";

import { useQuery } from "@tanstack/react-query";
import { mapPostToRecord } from "@/lib/post-mappers";
import { listPosts } from "@/services/posts-service";
import { searchItemsStaff } from "@/services/search-service";
import type { PostRecord } from "@/types/post-record";
import type { SearchMatchRow, SearchPostStatus, StaffSearchFilters } from "@/types/search";

export const initialStaffSearchFilters: StaffSearchFilters = {
  lastSeenDate: "",
  category: "",
  locationLastSeen: "",
  claimFromDate: "",
  claimToDate: "",
  itemStatuses: [],
  postStatuses: [],
  sort: "submission_date",
  sortDirection: "desc",
  limit: 50,
};

export const staffSearchKeys = {
  results: (query: string, filters: StaffSearchFilters) => ["staff-search", query, filters] as const,
};

function normalizeStatus(status: string | null | undefined): SearchPostStatus | null {
  if (!status) return null;
  const normalized = status.toLowerCase().replaceAll(" ", "_");
  if (normalized === "pending") return "pending";
  if (normalized === "accepted") return "accepted";
  if (normalized === "rejected") return "rejected";
  if (normalized === "reported") return "reported";
  if (normalized === "archived") return "archived";
  if (normalized === "fraud") return "fraud";
  if (normalized === "deleted") return "deleted";
  if (normalized === "claimed") return "claimed";
  if (normalized === "returned") return "returned";
  return null;
}

function pickPostId(row: SearchMatchRow): string | null {
  const value = row.id ?? row.post_id ?? row.postId ?? row.postID;
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function useStaffSearchResults(query: string, filters: StaffSearchFilters, enabled: boolean) {
  return useQuery({
    queryKey: staffSearchKeys.results(query, filters),
    enabled,
    queryFn: async (): Promise<PostRecord[]> => {
      const rawMatches = await searchItemsStaff({
        query,
        limit: filters.limit,
        lastSeenDate: filters.lastSeenDate || null,
        category: filters.category.trim() ? [filters.category.trim()] : null,
        locationLastSeen: filters.locationLastSeen.trim() || null,
        claimFrom: filters.claimFromDate || null,
        claimTo: filters.claimToDate || null,
        itemStatus: filters.itemStatuses.length > 0 ? filters.itemStatuses : null,
        sort: filters.sort,
        sortDirection: filters.sortDirection,
      });

      const filteredMatches =
        filters.postStatuses.length > 0
          ? rawMatches.filter((row) => {
              const normalized = normalizeStatus(
                typeof row.post_status === "string" ? row.post_status : null
              );
              return normalized ? filters.postStatuses.includes(normalized) : false;
            })
          : rawMatches;

      const dedupedPostIds = Array.from(
        new Set(filteredMatches.map(pickPostId).filter((value): value is string => value !== null))
      );

      if (dedupedPostIds.length === 0) {
        return [];
      }

      const postResponse = await listPosts({
        post_ids: dedupedPostIds,
        limit: dedupedPostIds.length,
        order_by: filters.sort,
        order_direction: filters.sortDirection,
      });

      const records = postResponse.posts.map(mapPostToRecord);
      const recordById = new Map(records.map((record) => [record.postId, record]));

      return dedupedPostIds
        .map((postId) => recordById.get(postId))
        .filter((record): record is PostRecord => Boolean(record));
    },
  });
}
