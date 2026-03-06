import { create } from "zustand";
import { countPosts, listPosts } from "@/services/posts-service";
import { fetchUnreadNotificationsCount } from "@/services/notifications-service";
import { mapPostToCompact } from "@/lib/post-mappers";
import type { CompactPost } from "@/components/staff/compact-post-card";

interface StaffDashboardParams {
  itemType?: "found" | "missing";
  postStatus?: string | null;
  pageSize?: number;
}

interface StaffDashboardStats {
  pendingClaims: number;
  fraudReports: number;
  unreadAlerts: number;
}

interface StaffDashboardStore {
  posts: CompactPost[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  pageSize: number;
  params: StaffDashboardParams;
  stats: StaffDashboardStats;
  statsLoading: boolean;
  fetchPosts: (params: StaffDashboardParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchStats: () => Promise<void>;
  removePost: (postId: string) => void;
}

const initialStats: StaffDashboardStats = {
  pendingClaims: 0,
  fraudReports: 0,
  unreadAlerts: 0,
};

export const useStaffDashboardStore = create<StaffDashboardStore>((set, get) => ({
  posts: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasMore: true,
  offset: 0,
  pageSize: 10,
  params: {},
  stats: initialStats,
  statsLoading: false,

  fetchPosts: async (params) => {
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
        order_direction: "desc",
      });

      const posts = response.posts.map(mapPostToCompact);
      set({
        posts,
        isLoading: false,
        offset: posts.length,
        hasMore: posts.length === pageSize,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load posts",
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
        order_direction: "desc",
      });
      const next = response.posts.map(mapPostToCompact);
      set((state) => ({
        posts: [...state.posts, ...next],
        isLoading: false,
        offset: state.offset + next.length,
        hasMore: next.length === pageSize,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load posts",
      });
    }
  },

  refresh: async () => {
    const { params } = get();
    set({ isRefreshing: true });
    await get().fetchPosts(params);
    set({ isRefreshing: false });
  },

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const [pending, fraud, unread] = await Promise.all([
        countPosts({ status: "pending" }),
        countPosts({ status: "fraud" }),
        fetchUnreadNotificationsCount(),
      ]);
      set({
        stats: {
          pendingClaims: pending.count,
          fraudReports: fraud.count,
          unreadAlerts: unread.unread_count,
        },
        statsLoading: false,
      });
    } catch (error) {
      set({
        statsLoading: false,
        error: error instanceof Error ? error.message : "Failed to load stats",
      });
    }
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.postId !== postId),
    }));
  },
}));
