import { PostRecordDetailView } from "@/components/staff/post-record-detail-view";

export default async function StaffPostRecordViewPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <PostRecordDetailView postId={postId} />;
}
