export interface DashboardPostsParams {
  itemType?: "found" | "missing";
  postStatus?: string | null;
  pageSize?: number;
}

export interface PostRecordsParams {
  itemType?: "found" | "missing";
  postStatus?: string | null;
  itemStatus?: string | null;
  sortDirection?: "asc" | "desc";
  pageSize?: number;
}
