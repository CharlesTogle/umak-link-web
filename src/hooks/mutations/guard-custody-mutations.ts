"use client";

import { useMutation } from "@tanstack/react-query";
import {
  scanGuardCustodySession,
  submitGuardCustodyDecision,
} from "@/services/guard-custody-service";
import type {
  GuardDecisionRequest,
  GuardDecisionResponse,
  GuardScanPayload,
  GuardScanResponse,
} from "@/types/guard-custody";

function mapScanPayloadToRequest(payload: GuardScanPayload) {
  if ("manualEntryCode" in payload) {
    return {
      manual_entry_code: payload.manualEntryCode,
    };
  }

  return {
    qr_code_session_id: payload.qrCodeSessionId,
    session_token: payload.sessionToken,
  };
}

export function useGuardScanMutation() {
  return useMutation<GuardScanResponse, Error, GuardScanPayload>({
    mutationFn: (payload) =>
      scanGuardCustodySession(mapScanPayloadToRequest(payload)),
    retry: 1,
  });
}

export function useGuardDecisionMutation(custodyAttemptId: string) {
  return useMutation<GuardDecisionResponse, Error, GuardDecisionRequest>({
    mutationFn: (payload) => submitGuardCustodyDecision(custodyAttemptId, payload),
    retry: 1,
  });
}
