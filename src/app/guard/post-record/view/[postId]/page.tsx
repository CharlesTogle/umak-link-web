import { GuardPostRecordView } from "@/components/guard/guard-post-record-view";

export default async function GuardPostRecordPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <GuardPostRecordView postId={postId} />;
}

