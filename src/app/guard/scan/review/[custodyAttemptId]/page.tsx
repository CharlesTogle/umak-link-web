import { GuardReviewView } from "@/components/guard/guard-review-view";

export default async function GuardReviewPage({
  params,
}: {
  params: Promise<{ custodyAttemptId: string }>;
}) {
  const { custodyAttemptId } = await params;

  return <GuardReviewView custodyAttemptId={custodyAttemptId} />;
}
