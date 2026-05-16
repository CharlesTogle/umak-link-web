import type { ApiCustodyStatus } from "@/types/post-record-api";

export type GuardAttemptStatus = "open" | "accepted" | "rejected" | "timed_out" | "cancelled";
export type GuardQrStatus = "active" | "accepted" | "rejected" | "expired" | "cancelled";
export type GuardDecision = "accepted" | "rejected";

export interface GuardQrPayloadRequest {
  qr_code_session_id: string;
  session_token: string;
}

export interface GuardManualCodeRequest {
  manual_entry_code: string;
}

export type GuardScanRequest = GuardQrPayloadRequest | GuardManualCodeRequest;

export interface GuardScanResponse {
  qr_code_session_id: string;
  custody_attempt_id: string;
  post_id: number;
  item_id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  handover_image_url: string | null;
  category: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  submission_date: string;
  guard_post_id: string;
  guard_post_name: string | null;
  attempt_number: number;
  custody_status: ApiCustodyStatus;
  qr_status: GuardQrStatus;
  attempt_status: GuardAttemptStatus;
}

export interface GuardDecisionRequest {
  qr_code_session_id: string;
  decision: GuardDecision;
  decision_reason?: string;
}

export interface GuardDecisionResponse {
  custody_attempt_id: string;
  qr_code_session_id: string;
  attempt_status: GuardAttemptStatus;
  qr_status: GuardQrStatus;
  custody_status: ApiCustodyStatus;
  decision_at: string;
}

export interface GuardQrPayload {
  qrCodeSessionId: string;
  sessionToken: string;
}

export interface GuardManualCodePayload {
  manualEntryCode: string;
}

export type GuardScanPayload = GuardQrPayload | GuardManualCodePayload;
export type GuardManualEntryPayload = GuardManualCodePayload;

export interface StoredGuardScanSession {
  scan: GuardScanResponse;
  scanned_at: string;
}

export interface GuardDecisionSummary {
  custody_attempt_id: string;
  qr_code_session_id: string;
  attempt_status: GuardDecisionResponse["attempt_status"];
  decision_at: string;
  item_name: string;
  guard_post_name: string | null;
}

export type GuardQrScannerPhase = "idle" | "starting" | "scanning" | "unsupported" | "error";

export interface GuardQrScannerState {
  isOpen: boolean;
  message: string;
  phase: GuardQrScannerPhase;
}
