import { create } from "zustand";
import { listPosts } from "@/services/posts-service";
import { mapPostToRecord } from "@/lib/post-mappers";
import type { PostRecord } from "@/types/post-record";

interface StaffPostRecordsParams {
  itemType?: "found" | "missing";
  postStatus?: string | null;
  sortDirection?: "asc" | "desc";
  pageSize?: number;
}

interface StaffPostRecordsStore {
  records: PostRecord[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  pageSize: number;
  params: StaffPostRecordsParams;
  fetchRecords: (params: StaffPostRecordsParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useStaffPostRecordsStore = create<StaffPostRecordsStore>((set, get) => ({
  records: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasMore: true,
  offset: 0,
  pageSize: 10,
  params: {},

  fetchRecords: async (params) => {
    const pageSize = params.pageSize ?? get().pageSize;
    set({
      isLoading: true,
      error: null,
      offset: 0,
      hasMore: true,
      params,
      pageSize,
    });

    try {
      const response = await listPosts({
        ...(params.itemType ? { item_type: params.itemType } : {}),
        ...(params.postStatus ? { status: params.postStatus } : {}),
        limit: pageSize,
        offset: 0,
        order_by: "submission_date",
        order_direction: params.sortDirection ?? "desc",
      });

      const records = response.posts.map(mapPostToRecord);
      set({
        records,
        isLoading: false,
        offset: records.length,
        hasMore: records.length === pageSize,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load records",
      });
    }
  },

  loadMore: async () => {
    const { isLoading, hasMore, offset, pageSize, params } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      const response = await listPosts({
        ...(params.itemType ? { item_type: params.itemType } : {}),
        ...(params.postStatus ? { status: params.postStatus } : {}),
        limit: pageSize,
        offset,
        order_by: "submission_date",
        order_direction: params.sortDirection ?? "desc",
      });
      const next = response.posts.map(mapPostToRecord);
      set((state) => ({
        records: [...state.records, ...next],
        isLoading: false,
        offset: state.offset + next.length,
        hasMore: next.length === pageSize,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load records",
      });
    }
  },

  refresh: async () => {
    const { params } = get();
    set({ isRefreshing: true });
    await get().fetchRecords(params);
    set({ isRefreshing: false });
  },
}));
