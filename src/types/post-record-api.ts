export interface ApiPostRecord {
  post_id: number;
  item_id: string | null;
  poster_name: string | null;
  poster_id: string | null;
  poster_profile_picture_url?: string | null;
  item_name: string | null;
  item_description: string | null;
  item_type: "found" | "missing";
  item_image_url: string | null;
  category: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  submission_date: string | null;
  post_status: string | null;
  item_status: string | null;
  is_anonymous: boolean;
}

export interface ApiPostListResponse {
  posts: ApiPostRecord[];
  count?: number;
}

export type ApiPostStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "archived"
  | "deleted"
  | "reported"
  | "fraud";

export type ApiItemStatus = "claimed" | "unclaimed" | "discarded" | "returned" | "lost";

export interface ApiPostRecordDetails {
  post_id: number | string;
  poster_id: string;
  post_status: ApiPostStatus | string;
  item_id: string;
  is_anonymous: boolean;
  submitted_on_date_local: string | null;
  rejection_reason: string | null;
  accepted_on_date_local: string | null;
  last_seen_date: string | null;
  last_seen_time: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  item_name: string;
  item_description: string | null;
  image_id: string | null;
  item_image_url: string | null;
  item_status: ApiItemStatus | string;
  item_type: "found" | "missing" | string;
  category: string | null;
  poster_name: string;
  poster_email: string;
  poster_profile_picture_url: string | null;
  claim_id: string | null;
  claimer_name: string | null;
  claimer_school_email: string | null;
  claimer_contact_num: string | null;
  claimed_at: string | null;
  claim_processed_by_name: string | null;
  claim_processed_by_email: string | null;
  claim_processed_by_profile_picture_url: string | null;
  linked_lost_item_id: string | null;
  returned_at: string | null;
}
