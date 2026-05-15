export interface ApiPostRecord {
  post_id: number;
  item_id: string | null;
  poster_name: string | null;
  poster_id: string | null;
  poster_profile_picture_url?: string | null;
  profile_picture_url?: string | null;
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
  accepted_on_date?: string | null;
  accepted_by_staff_name?: string | null;
  accepted_by_staff_email?: string | null;
  claim_id?: string | null;
  claimed_by_name?: string | null;
  claimed_by_email?: string | null;
  claimed_by_contact?: string | null;
  claimed_at?: string | null;
  claim_processed_by_staff_id?: string | null;
  custody_status?: ApiCustodyStatus | null;
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
export type ApiCustodyStatus =
  | "untracked"
  | "with_reporter"
  | "handover_in_progress"
  | "with_guard"
  | "in_security_office"
  | "claimed_by_student"
  | "under_investigation";

export type ApiEditableClaimedCustodyStatus =
  | "in_security_office"
  | "under_investigation"
  | "claimed_by_student";

export type ApiCustodyHistoryEventType =
  | "item_reported"
  | "handover_attempted"
  | "guard_rejected"
  | "guard_accepted"
  | "session_timed_out"
  | "security_office_received"
  | "attempt_cancelled"
  | "under_investigation"
  | "physical_take_reported"
  | "claimed_by_student";

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
  claim_processed_by_user_type?: "User" | "Staff" | "Admin" | "Guard" | null;
  linked_lost_item_id: string | null;
  returned_at: string | null;
  custody_status?: ApiCustodyStatus | null;
}

export interface ApiCustodyHistoryEntry {
  history_id: string;
  event_type: ApiCustodyHistoryEventType;
  source_record_type: string | null;
  message: string;
  occurred_at: string;
  custody_attempt_id: string | null;
  qr_code_session_id: string | null;
  attempt_number: number | null;
  guard_post_id: string | null;
  guard_post_name: string | null;
  full_location_name: string | null;
  handover_image_url: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
}

export interface ApiCustodyHistoryResponse {
  post_id: number;
  item_id: string;
  post_status: string | null;
  custody_status: ApiCustodyStatus;
  history: ApiCustodyHistoryEntry[];
}

export interface ApiSecurityOfficeReceiptResponse {
  post_id: number;
  custody_attempt_id: string;
  custody_status: ApiCustodyStatus;
  office_received_at: string;
}

export interface ApiOpenCustodyInvestigationResponse {
  post_id: number;
  custody_attempt_id: string;
  custody_status: ApiCustodyStatus;
  investigation_opened_at: string;
}

export interface ApiNotifyGuardResponse {
  post_id: number;
  custody_attempt_id: string;
  guard_id: string;
  notification_id: string | number;
  notification_status: "created";
  requested_at: string;
}

export interface ApiUpdateClaimedCustodyStatusResponse {
  post_id: number;
  item_id: string;
  custody_status: ApiEditableClaimedCustodyStatus;
  updated_at: string;
}
