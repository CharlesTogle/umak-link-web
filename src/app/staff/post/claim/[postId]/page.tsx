import { StaffClaimPostView } from "@/components/staff/staff-claim-post-view";

export default async function StaffClaimPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <StaffClaimPostView postId={postId} />;
}
