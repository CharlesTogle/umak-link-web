"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createClaimVerificationSession,
  getClaimVerificationSessionStatus,
  getGuardActiveClaimReviews,
} from "@/services/claim-verification-service";
import type { ClaimVerificationSessionStatusResponse } from "@/types/claim-verification";

const CLAIM_VERIFICATION_POLL_INTERVAL_MS = 4000;

export const claimVerificationKeys = {
  bootstrap: (foundPostId: number) =>
    ["claim-verification", "bootstrap", foundPostId] as const,
  processorSession: (postId: string, mode: "staff" | "guard") =>
    ["claim-verification", "processor-session", mode, postId] as const,
  status: (claimVerificationSessionId: string) =>
    ["claim-verification", "status", claimVerificationSessionId] as const,
  sessionStatus: (claimVerificationSessionId: string) =>
    ["claim-verification", "status", claimVerificationSessionId] as const,
  guardActiveReviews: ["claim-verification", "guard-active-reviews"] as const,
};

function shouldContinuePolling(
  status: ClaimVerificationSessionStatusResponse | undefined
): boolean {
  if (!status) return true;

  return !["completed", "cancelled", "expired"].includes(status.status);
}

export function useClaimVerificationSessionBootstrap(
  foundPostId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: claimVerificationKeys.bootstrap(foundPostId ?? 0),
    queryFn: async () =>
      await createClaimVerificationSession({
        found_post_id: foundPostId!,
      }),
    enabled: Boolean(foundPostId) && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

export function useProcessorClaimVerificationSession(
  postId: string,
  mode: "staff" | "guard",
  enabled = true
) {
  return useQuery({
    queryKey: claimVerificationKeys.processorSession(postId, mode),
    queryFn: async () =>
      await createClaimVerificationSession({
        found_post_id: Number(postId),
      }),
    enabled: Number.isFinite(Number(postId)) && Number(postId) > 0 && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useClaimVerificationSessionStatus(
  claimVerificationSessionId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: claimVerificationKeys.status(claimVerificationSessionId ?? "missing"),
    queryFn: async () =>
      await getClaimVerificationSessionStatus(claimVerificationSessionId!),
    enabled: Boolean(claimVerificationSessionId) && enabled,
    refetchInterval: (query) =>
      shouldContinuePolling(query.state.data)
        ? CLAIM_VERIFICATION_POLL_INTERVAL_MS
        : false,
    retry: 1,
  });
}

export function useClaimVerificationStatusQuery(
  claimVerificationSessionId: string | null,
  enabled = true
) {
  return useClaimVerificationSessionStatus(claimVerificationSessionId, enabled);
}

export function useGuardActiveClaimReviews(enabled = true) {
  return useQuery({
    queryKey: claimVerificationKeys.guardActiveReviews,
    queryFn: getGuardActiveClaimReviews,
    enabled,
    retry: 1,
  });
}

export function useGuardActiveClaimReviewsQuery(enabled = true) {
  return useGuardActiveClaimReviews(enabled);
}
