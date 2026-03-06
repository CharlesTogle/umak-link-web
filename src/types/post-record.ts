export interface PostRecord {
  postId: string;
  posterId: string | null;
  posterProfileUrl?: string | null;
  itemId: string | null;
  hoursAgo: number;
  username: string;
  isAnonymous: boolean;
  title: string;
  imageUrl: string | null;
  itemName: string;
  itemDescription: string | null;
  category: string | null;
  itemType: "missing" | "found";
  postStatus: "Pending" | "Accepted" | "Rejected" | "Reported" | "Archived" | "Fraud" | "Deleted";
  itemStatus: "Claimed" | "Unclaimed" | "Lost" | "Returned";
  lastSeenLocation: string | null;
  lastSeenAt: string | null;
  submissionDate: string | null;
}

export type PostRecordAction =
  | "view"
  | "share"
  | "notify"
  | "claim"
  | "change-status"
  | "copy-item-id";

export type PostRecordSortDirection = "desc" | "asc";

export type PostRecordFilterKey = "postStatus" | "itemStatus" | "itemType";

export interface PostRecordFilters {
  postStatus: "all" | PostRecord["postStatus"];
  itemStatus: "all" | PostRecord["itemStatus"];
  itemType: "all" | PostRecord["itemType"];
}
