export type ClaimVerificationSessionStatus =
  | "awaiting_claimer"
  | "qr_active"
  | "scanned"
  | "completed"
  | "expired"
  | "cancelled";

export type ClaimQrSessionStatus =
  | "active"
  | "scanned"
  | "expired"
  | "cancelled";

export type ClaimVerificationMethod =
  | "manual_staff"
  | "staff_qr"
  | "guard_qr";

export interface ClaimVerificationRetryMetadata {
  number_of_attempts: number;
  max_number_of_attempts: number;
  retries_remaining: number;
}

export interface ClaimVerifiedClaimerSummary {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url: string | null;
}

export interface ClaimVerificationPostSummary {
  post_id: number;
  item_id: string;
  item_name: string | null;
  item_image_url: string | null;
  item_description: string | null;
}

export interface ClaimSessionQrScanPayload {
  kind: "claim_session";
  claimQrSessionId: string;
  sessionToken: string;
}

export interface StaffClaimManualCodeQrScanPayload {
  kind: "staff_claim_manual_code";
  manualEntryCode: string;
}

export interface StaffClaimUserQrScanPayload {
  kind: "staff_claim_user_identity";
  userId: string;
  userName: string;
  email: string;
  profilePictureUrl: string | null;
}

export type ClaimQrScanPayload =
  | ClaimSessionQrScanPayload
  | StaffClaimManualCodeQrScanPayload
  | StaffClaimUserQrScanPayload;

export type ClaimQrManualEntryPayload = ClaimSessionQrScanPayload;

export interface CreateClaimVerificationSessionRequest {
  found_post_id: number;
}

export interface ClaimVerificationSessionStatusResponse
  extends ClaimVerificationRetryMetadata {
  claim_verification_session_id: string;
  found_post_id: number;
  item_id: string;
  join_code: string;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus | null;
  expires_at: string;
  scanned_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  current_window_expired: boolean;
  can_retry: boolean;
  verified_claimer: ClaimVerifiedClaimerSummary | null;
}

export type CreateClaimVerificationSessionResponse =
  ClaimVerificationSessionStatusResponse;

export interface ScanClaimVerificationRequest {
  claim_qr_session_id: string;
  session_token: string;
}

export interface ScanClaimVerificationResponse {
  claim_verification_session_id: string;
  claim_qr_session_id: string;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus;
  scanned_at: string;
  verified_claimer: ClaimVerifiedClaimerSummary;
}

export interface CancelClaimVerificationSessionResponse
  extends ClaimVerificationRetryMetadata {
  claim_verification_session_id: string;
  claim_qr_session_id: string | null;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus | null;
  cancelled_at: string;
}

export interface GuardActiveClaimReviewRecord {
  post_id: number;
  item_id: string;
  item_name: string | null;
  item_description: string | null;
  item_image_url: string | null;
  category: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  poster_name: string | null;
  poster_profile_picture_url: string | null;
  submitted_on_date_local: string | null;
  custody_status: string | null;
  post_status: string | null;
  item_status: string | null;
}

export interface GuardActiveClaimReviewsResponse {
  posts: GuardActiveClaimReviewRecord[];
}

export interface ClaimVerificationSubmission {
  claim_verification_session_id: string;
  verification_method: Exclude<ClaimVerificationMethod, "manual_staff">;
}

export type ClaimQrScannerPhase =
  | "idle"
  | "starting"
  | "scanning"
  | "unsupported"
  | "error";

export interface ClaimQrScannerState {
  isOpen: boolean;
  message: string;
  phase: ClaimQrScannerPhase;
}
