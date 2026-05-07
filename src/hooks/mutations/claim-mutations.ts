"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processClaimSubmission } from "@/services/claims-service";
import type { ProcessClaimRequest } from "@/types/claims";

export function useProcessClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessClaimRequest) => processClaimSubmission(payload),
    retry: 1,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
