export interface SearchItemsStaffRequest {
  query: string;
  limit?: number;
  lastSeenDate?: string | null;
  category?: string[] | null;
  locationLastSeen?: string | null;
  claimFrom?: string | null;
  claimTo?: string | null;
  itemStatus?: SearchItemStatus[] | null;
  sort?: "accepted_on_date" | "submission_date";
  sortDirection?: "asc" | "desc";
}

export interface SearchItemsStaffApiRequest {
  query: string;
  limit?: number;
  last_seen_date?: string | null;
  category?: string[] | null;
  location_last_seen?: string | null;
  claim_from?: string | null;
  claim_to?: string | null;
  item_status?: SearchItemStatus[] | null;
  sort?: "accepted_on_date" | "submission_date";
  sort_direction?: "asc" | "desc";
}

export interface SearchMatchRow {
  id?: string | number | null;
  post_id?: string | number | null;
  postId?: string | number | null;
  postID?: string | number | null;
  post_status?: string | null;
  [key: string]: unknown;
}

export interface SearchItemsStaffApiResponse {
  results: SearchMatchRow[];
}

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

export type SearchItemStatus = "claimed" | "unclaimed" | "discarded" | "returned" | "lost";

export type SearchPostStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "reported"
  | "archived"
  | "fraud"
  | "deleted"
  | "claimed"
  | "returned";

export interface ReverseImageQueryRequest {
  imageDataUrl: string;
  searchValue?: string;
}

export interface ReverseImageQueryApiRequest {
  image_data_url: string;
  search_value?: string;
}

export interface ReverseImageQueryResponse {
  success: boolean;
  search_query: string;
  error?: string;
  message?: string;
}
