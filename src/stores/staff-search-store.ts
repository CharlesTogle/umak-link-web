import { isAxiosError } from "axios";
import { create } from "zustand";
import { mapPostToRecord } from "@/lib/post-mappers";
import { listPosts } from "@/services/posts-service";
import { searchItemsStaff } from "@/services/search-service";
import type { PostRecord } from "@/types/post-record";
import type { SearchItemStatus, SearchMatchRow, SearchPostStatus } from "@/types/search";

export interface StaffSearchFilters {
  lastSeenDate: string;
  category: string;
  locationLastSeen: string;
  claimFromDate: string;
  claimToDate: string;
  itemStatuses: SearchItemStatus[];
  postStatuses: SearchPostStatus[];
  sort: "accepted_on_date" | "submission_date";
  sortDirection: "asc" | "desc";
  limit: number;
}

interface StaffSearchState {
  query: string;
  filters: StaffSearchFilters;
  matchedPostIds: string[];
  results: PostRecord[];
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
  isOffline: boolean;

  setQuery: (query: string) => void;
  setFilters: (filters: Partial<StaffSearchFilters>) => void;
  toggleItemStatus: (status: SearchItemStatus) => void;
  togglePostStatus: (status: SearchPostStatus) => void;
  setOffline: (isOffline: boolean) => void;
  runSearch: (nextQuery?: string) => Promise<void>;
  clearSearch: () => void;
}

const initialFilters: StaffSearchFilters = {
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

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const responseData = error.response?.data;
    if (typeof responseData === "object" && responseData && "message" in responseData) {
      const message = responseData.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    if (typeof error.response?.statusText === "string" && error.response.statusText.trim()) {
      return error.response.statusText;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Search failed. Please try again.";
}

function hasNetworkIssue(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return !error.response || error.code === "ERR_NETWORK";
}

function isBrowserOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine;
}

export const useStaffSearchStore = create<StaffSearchState>((set, get) => ({
  query: "",
  filters: initialFilters,
  matchedPostIds: [],
  results: [],
  isLoading: false,
  hasSearched: false,
  error: null,
  isOffline: false,

  setQuery: (query) => set({ query }),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  toggleItemStatus: (status) =>
    set((state) => ({
      filters: {
        ...state.filters,
        itemStatuses: state.filters.itemStatuses.includes(status)
          ? state.filters.itemStatuses.filter((itemStatus) => itemStatus !== status)
          : [...state.filters.itemStatuses, status],
      },
    })),

  togglePostStatus: (status) =>
    set((state) => ({
      filters: {
        ...state.filters,
        postStatuses: state.filters.postStatuses.includes(status)
          ? state.filters.postStatuses.filter((postStatus) => postStatus !== status)
          : [...state.filters.postStatuses, status],
      },
    })),

  setOffline: (isOffline) => set({ isOffline }),

  runSearch: async (nextQuery) => {
    const query = (nextQuery ?? get().query).trim();
    const filters = get().filters;

    set({
      query,
      isLoading: true,
      hasSearched: query.length > 0,
      error: null,
      isOffline: false,
    });

    if (!query) {
      set({
        isLoading: false,
        hasSearched: false,
        results: [],
        matchedPostIds: [],
      });
      return;
    }

    if (isBrowserOffline()) {
      set({
        isLoading: false,
        isOffline: true,
        error: null,
        results: [],
        matchedPostIds: [],
      });
      return;
    }

    try {
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
        set({
          isLoading: false,
          error: null,
          isOffline: false,
          results: [],
          matchedPostIds: [],
        });
        return;
      }

      const postResponse = await listPosts({
        post_ids: dedupedPostIds,
        limit: dedupedPostIds.length,
        order_by: filters.sort,
        order_direction: filters.sortDirection,
      });

      const records = postResponse.posts.map(mapPostToRecord);
      const recordById = new Map(records.map((record) => [record.postId, record]));
      const orderedRecords = dedupedPostIds
        .map((postId) => recordById.get(postId))
        .filter((record): record is PostRecord => Boolean(record));

      set({
        isLoading: false,
        error: null,
        isOffline: false,
        matchedPostIds: dedupedPostIds,
        results: orderedRecords,
      });
    } catch (error) {
      const networkIssue = isBrowserOffline() || hasNetworkIssue(error);
      set({
        isLoading: false,
        isOffline: networkIssue,
        error: networkIssue ? null : getErrorMessage(error),
        results: [],
        matchedPostIds: [],
      });
    }
  },

  clearSearch: () =>
    set({
      query: "",
      filters: initialFilters,
      results: [],
      matchedPostIds: [],
      hasSearched: false,
      isLoading: false,
      error: null,
      isOffline: false,
    }),
}));
