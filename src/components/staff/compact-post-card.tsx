"use client";

import Image from "next/image";
import { CheckCircle2, Share2, UserCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { StaffPosterName } from "@/components/staff/staff-poster-name";
import { PostTagChip } from "@/components/staff/post-tag-chip";
import { formatDateInPhilippineTime } from "@/lib/date-time-helpers";
import { formatRelativeTime } from "@/lib/time";
import type { CompactPost } from "@/types/compact-post";

const EMPTY_DESCRIPTION = "No description provided.";

function formatDate(value: string | null): string {
  return formatDateInPhilippineTime(value, "N/A");
}

function statusTone(status: CompactPost["postStatus"]): "warning" | "success" | "danger" | "primary" {
  if (status === "Accepted" || status === "Returned") return "success";
  if (status === "Rejected") return "danger";
  if (status === "Claimed") return "primary";
  return "warning";
}

function itemStatusTone(status: CompactPost["itemStatus"]): "warning" | "success" | "primary" | "neutral" {
  if (status === "Claimed") return "primary";
  if (status === "Returned") return "success";
  if (status === "Lost" || status === "Unclaimed") return "warning";
  return "neutral";
}

export function CompactPostCard({
  post,
  onAccept,
  onReject,
  onNotifySimilar,
  onShare,
  actionsDisabled = false,
  loadingAction = null,
}: {
  post: CompactPost;
  onAccept?: (post: CompactPost) => void;
  onReject?: (post: CompactPost) => void;
  onNotifySimilar?: (post: CompactPost) => void;
  onShare?: (post: CompactPost) => void;
  actionsDisabled?: boolean;
  loadingAction?: "accept" | "reject" | "notify" | null;
}) {
  const router = useRouter();
  const isMissingItem = post.itemType === "lost";
  const showActions = post.postStatus === "Pending" && (onAccept || onReject || onNotifySimilar);

  const handleCardClick = () => {
    router.push(`/staff/post-record/view/${post.postId}`);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
      className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-700">
            {post.posterProfileUrl ? (
              <Image
                src={post.posterProfileUrl}
                alt={post.username}
                width={28}
                height={28}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <UserCircle2 className="size-4" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <StaffPosterName
              name={post.username}
              isAnonymous={post.isAnonymous}
              className="min-w-0 flex-1"
              nameClassName="font-medium text-slate-700"
            />
            <span className="shrink-0 text-slate-300">•</span>
            <span className="shrink-0 whitespace-nowrap">{formatRelativeTime(post.submissionDate, post.hoursAgo)}</span>
          </div>
        </div>
        <PostTagChip label={post.itemType === "lost" ? "Lost Item" : "Found Item"} tone="primary" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PostTagChip label={post.postStatus} tone={statusTone(post.postStatus)} />
        <PostTagChip label={post.itemStatus} tone={itemStatusTone(post.itemStatus)} />
        {post.category ? <PostTagChip label={post.category} tone="neutral" /> : null}
      </div>

      <h3 className="text-xl font-semibold leading-tight text-slate-900">{post.title}</h3>
      <p className="mt-3 text-sm text-slate-600">{post.itemDescription ?? EMPTY_DESCRIPTION}</p>

      {post.imageUrl ? (
        <div className="relative mt-4 h-56 w-full overflow-hidden rounded-2xl md:h-72">
          <Image src={post.imageUrl} alt={post.itemName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 60vw" />
        </div>
      ) : null}

      <div className="mt-4 grid gap-1 text-sm text-slate-600">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">Owner:</span>
          <StaffPosterName
            name={post.username}
            isAnonymous={post.isAnonymous}
            nameClassName="text-slate-600"
          />
        </p>
        <p>
          <span className="text-slate-500">Last seen:</span> {post.lastSeenLocation ?? "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Last seen date:</span> {formatDate(post.lastSeenAt)}
        </p>
        <p>
          <span className="text-slate-500">Submitted:</span> {formatDate(post.submissionDate)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {showActions ? (
          <>
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={(event) => {
                event.stopPropagation();
                onAccept?.(post);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="size-4" />{" "}
              {loadingAction === "accept"
                ? isMissingItem
                  ? "Matching..."
                  : "Approving..."
                : isMissingItem
                  ? "Match"
                  : "Approve"}
            </button>
            {isMissingItem ? (
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onNotifySimilar?.(post);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="size-4" />{" "}
                {loadingAction === "notify"
                  ? "Notifying..."
                  : "Send Similar Item Notification"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={(event) => {
                event.stopPropagation();
                onReject?.(post);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="size-4" /> {loadingAction === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onShare?.(post);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
        >
          <Share2 className="size-4" /> Share
        </button>
      </div>
    </article>
  );
}
