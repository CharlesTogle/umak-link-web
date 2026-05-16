"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelClaimVerificationSession,
  scanClaimVerificationSession,
} from "@/services/claim-verification-service";
import { claimVerificationKeys } from "@/hooks/queries/claim-verification-queries";
import type { ScanClaimVerificationRequest } from "@/types/claim-verification";

export function useScanClaimVerificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScanClaimVerificationRequest) =>
      scanClaimVerificationSession(payload),
    retry: 1,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: claimVerificationKeys.status(
          response.claim_verification_session_id
        ),
      });
    },
  });
}

export function useCancelClaimVerificationMutation(
  claimVerificationSessionId: string | null
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!claimVerificationSessionId) {
        throw new Error("Missing claim verification session.");
      }

      return cancelClaimVerificationSession(claimVerificationSessionId);
    },
    retry: 1,
    onSuccess: async () => {
      if (!claimVerificationSessionId) return;

      await queryClient.invalidateQueries({
        queryKey: claimVerificationKeys.status(claimVerificationSessionId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["claim-verification"],
      });
    },
  });
}
