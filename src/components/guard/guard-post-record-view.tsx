"use client";

import { ArrowLeft, Handshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import {
  LinkedPostPanel,
  PostRecordCustodyPanel,
  PostRecordDetailsPanel,
  PostRecordMainPanel,
  PostRecordStatusPanel,
} from "@/components/staff/post-record-detail-view-sections";
import { useLinkedPost, usePostCustodyHistory, usePostDetail } from "@/hooks/queries/post-queries";
import { normalizeValue } from "@/lib/format-utils";
import type {
  ApiCustodyStatus,
  ApiItemStatus,
  ApiPostStatus,
} from "@/types/post-record-api";
import type { LinkedPostRecord } from "@/types/ui";

function getStatusColor(status: string): string {
  const normalized = normalizeValue(status);
  if (normalized === "accepted") return "text-emerald-600";
  if (normalized === "rejected" || normalized === "discarded" || normalized === "fraud") {
    return "text-rose-700";
  }
  if (normalized === "claimed" || normalized === "returned") return "text-blue-700";
  return "text-amber-600";
}

function getLinkedOwnerName(linkedPost: LinkedPostRecord): string {
  return linkedPost.poster_name ?? "Unknown User";
}

function getLinkedPostAvatar(linkedPost: LinkedPostRecord): string | null {
  return linkedPost.poster_profile_picture_url ?? null;
}

export function GuardPostRecordView({ postId }: { postId: string }) {
  const router = useRouter();
  const postQuery = usePostDetail(postId);
  const record = postQuery.data ?? null;
  const linkedPostQuery = useLinkedPost(record, postId);
  const linkedPost = linkedPostQuery.data ?? null;
  const isFoundItem = normalizeValue(record?.item_type) === "found";
  const custodyHistoryQuery = usePostCustodyHistory(postId, Boolean(record) && isFoundItem);
  const normalizedItemStatus = normalizeValue(record?.item_status) as ApiItemStatus;
  const normalizedPostStatus = normalizeValue(record?.post_status) as ApiPostStatus;
  const normalizedCustodyStatus = normalizeValue(record?.custody_status) as ApiCustodyStatus;
  const canClaimItem =
    isFoundItem &&
    normalizedItemStatus === "unclaimed" &&
    normalizedPostStatus === "accepted" &&
    normalizedCustodyStatus === "with_guard";

  if (postQuery.isLoading) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Post not found or not available for guard review
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The item may no longer be assigned to the current guard.
          </p>
        </div>
      </section>
    );
  }

  return (
    <PhotoProvider>
      <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-1">
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/guard/active-reviews")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" /> Back to Active Reviews
            </button>
            {canClaimItem ? (
              <button
                type="button"
                onClick={() => router.push(`/guard/post/claim/${record.post_id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
              >
                <Handshake className="size-4" /> Claim item
              </button>
            ) : null}
          </div>
        </article>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-12">
          <PostRecordMainPanel record={record} linkedPost={linkedPost} />
          <PostRecordStatusPanel record={record} getStatusColor={getStatusColor} />
          {linkedPost ? (
            <LinkedPostPanel
              linkedPost={linkedPost}
              isLinkedLoading={linkedPostQuery.isFetching}
              normalizedItemStatus={normalizedItemStatus}
              getLinkedOwnerName={getLinkedOwnerName}
              getLinkedPostAvatar={getLinkedPostAvatar}
              onViewLinkedPost={() =>
                router.push(`/guard/post-record/view/${String(linkedPost.post_id)}`)
              }
            />
          ) : null}
          <PostRecordDetailsPanel
            record={record}
            normalizedItemStatus={normalizedItemStatus}
          />
        </div>

        <PostRecordCustodyPanel
          history={custodyHistoryQuery.data ?? null}
          isLoading={custodyHistoryQuery.isLoading}
          errorMessage={
            custodyHistoryQuery.error instanceof Error
              ? custodyHistoryQuery.error.message
              : null
          }
        />
      </section>
    </PhotoProvider>
  );
}

