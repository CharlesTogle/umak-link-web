export interface ApiFraudReportPublic {
  report_id: string;
  post_id: number;
  report_status?: string | null;
  status?: string | null;
  reason_for_reporting?: string | null;
  reason?: string | null;
  date_reported?: string | null;
  created_at?: string | null;
  proof_image_url?: string | null;
  poster_id?: string | null;
  post_status?: string | null;
  item_id?: string | null;
  is_anonymous?: boolean | null;
  last_seen_at?: string | null;
  last_seen_location?: string | null;
  item_name?: string | null;
  item_description?: string | null;
  item_image_url?: string | null;
  item_status?: string | null;
  item_type?: string | null;
  category?: string | null;
  claimer_name?: string | null;
  claimer_school_email?: string | null;
  claimer_contact_num?: string | null;
  claimed_at?: string | null;
  claim_id?: string | null;
  linked_lost_item_id?: string | null;
  reporter_id?: string | null;
  reporter_name?: string | null;
  reporter_profile_picture_url?: string | null;
  poster_name?: string | null;
  poster_profile_picture_url?: string | null;
  fraud_reviewer_id?: string | null;
  fraud_reviewer_name?: string | null;
  fraud_reviewer_email?: string | null;
  submitted_on_date_local?: string | null;
  accepted_on_date_local?: string | null;
  last_seen_date?: string | null;
  last_seen_time?: string | null;
  image_id?: string | null;
  claim_processed_by_name?: string | null;
  claim_processed_by_email?: string | null;
  claim_processed_by_profile_picture_url?: string | null;
  claim_processed_by_user_type?: "User" | "Staff" | "Admin" | "Guard" | null;
  reporter_email?: string | null;
  poster_email?: string | null;
  fraud_reviewer_profile_picture_url?: string | null;
}

export interface ApiFraudReportListResponse {
  reports: ApiFraudReportPublic[];
  count?: number;
}
