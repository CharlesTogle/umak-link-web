"use client";

import { ProcessorClaimPostView } from "@/components/claims/processor-claim-post-view";

export function GuardClaimPostView({ postId }: { postId: string }) {
  return <ProcessorClaimPostView mode="guard" postId={postId} />;
}
