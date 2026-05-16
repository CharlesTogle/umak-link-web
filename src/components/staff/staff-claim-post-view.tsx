"use client";

import { ProcessorClaimPostView } from "@/components/claims/processor-claim-post-view";

export function StaffClaimPostView({ postId }: { postId: string }) {
  return <ProcessorClaimPostView mode="staff" postId={postId} />;
}
