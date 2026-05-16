import { GuardClaimPostView } from "@/components/guard/guard-claim-post-view";

export default async function GuardClaimPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <GuardClaimPostView postId={postId} />;
}
