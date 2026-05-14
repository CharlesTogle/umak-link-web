import type { ApiCustodyStatus } from "@/types/post-record-api";

export interface CompactPost {
  postId: string;
  posterId: string | null;
  itemId: string | null;
  hoursAgo: number;
  username: string;
  isAnonymous: boolean;
  posterProfileUrl?: string | null;
  title: string;
  imageUrl: string | null;
  itemName: string;
  itemDescription: string | null;
  category: string | null;
  itemType: "lost" | "found";
  postStatus:
    | "Pending"
    | "Accepted"
    | "Rejected"
    | "Claimed"
    | "Returned"
    | "Reported"
    | "Archived"
    | "Fraud"
    | "Deleted";
  itemStatus: "Lost" | "Found" | "Unclaimed" | "Claimed" | "Returned";
  custodyStatus: ApiCustodyStatus | null;
  lastSeenLocation: string | null;
  lastSeenAt: string | null;
  submissionDate: string | null;
}
