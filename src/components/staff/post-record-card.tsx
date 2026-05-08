"use client";

import Image from "next/image";
import { Copy, Ellipsis, FileText, Handshake, Mail, Share2, UserCircle2 } from "lucide-react";
import type { MouseEvent } from "react";
import { PostTagChip } from "@/components/staff/post-tag-chip";
import { formatDateInPhilippineTime } from "@/lib/date-time-helpers";
import { formatRelativeTime } from "@/lib/time";
import type { PostRecord, PostRecordAction } from "@/types/post-record";

const EMPTY_DESCRIPTION = "No description provided.";

function formatDate(value: string | null): string {
  return formatDateInPhilippineTime(value, "N/A");
}

function statusTone(status: PostRecord["postStatus"]): "warning" | "success" | "danger" {
  if (status === "Accepted") return "success";
  if (status === "Rejected") return "danger";
  return "warning";
}

function itemStatusTone(status: PostRecord["itemStatus"]): "neutral" | "success" | "primary" {
  if (status === "Returned") return "success";
  if (status === "Claimed") return "primary";
  return "neutral";
}

export function PostRecordCard({
  record,
  onAction,
}: {
  record: PostRecord;
  onAction: (action: PostRecordAction, record: PostRecord) => void;
}) {
  const displayName = record.isAnonymous ? "Anonymous" : record.username;
  const canNotify = record.itemType === "missing" && record.itemStatus === "Lost";
  const canClaim =
    record.itemType === "found" && record.itemStatus === "Unclaimed" && record.postStatus === "Accepted";
  const canCopyItemId =
    record.itemType === "missing" && record.postStatus === "Accepted" && record.itemStatus === "Lost" && record.itemId;
  const handleCardOpen = () => onAction("view", record);
  const handleActionClick = (action: PostRecordAction) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAction(action, record);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardOpen();
        }
      }}
      className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-700">
            {record.posterProfileUrl ? (
              <Image
                src={record.posterProfileUrl}
                alt={record.isAnonymous ? "Anonymous user" : record.username}
                width={28}
                height={28}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <UserCircle2 className="size-4" />
            )}
          </span>
          <span className="truncate font-medium text-slate-700">{displayName}</span>
          <span className="text-slate-300">•</span>
          <span className="whitespace-nowrap">{formatRelativeTime(record.submissionDate, record.hoursAgo)}</span>
        </div>
        <PostTagChip
          label={record.itemType === "missing" ? "Missing Item" : "Found Item"}
          tone="primary"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PostTagChip label={record.postStatus} tone={statusTone(record.postStatus)} />
        <PostTagChip label={record.itemStatus} tone={itemStatusTone(record.itemStatus)} />
        {record.category ? <PostTagChip label={record.category} tone="neutral" /> : null}
      </div>

      <h3 className="mb-3 text-xl font-semibold leading-tight text-slate-900">{record.title}</h3>

      {record.imageUrl ? (
        <div className="relative mb-3 h-56 w-full overflow-hidden rounded-2xl md:h-72">
          <Image
            src={record.imageUrl}
            alt={record.itemName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        </div>
      ) : null}

      <div className="grid gap-1 text-sm text-slate-600">
        <p>
          <span className="text-slate-500">Last seen:</span> {record.lastSeenLocation ?? "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Last seen date:</span> {formatDate(record.lastSeenAt)}
        </p>
        <p>
          <span className="text-slate-500">Submitted:</span> {formatDate(record.submissionDate)}
        </p>
      </div>

      <p className="mt-3 text-sm text-slate-600">{record.itemDescription ?? EMPTY_DESCRIPTION}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
          onClick={handleActionClick("view")}
        >
          <FileText className="size-4" /> View details
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
          onClick={handleActionClick("share")}
        >
          <Share2 className="size-4" /> Share
        </button>
        {canNotify ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100"
            onClick={handleActionClick("notify")}
          >
            <Mail className="size-4" /> Notify owner
          </button>
        ) : null}
        {canClaim ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100"
            onClick={handleActionClick("claim")}
          >
            <Handshake className="size-4" /> Claim item
          </button>
        ) : null}
        {canCopyItemId ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
            onClick={handleActionClick("copy-item-id")}
          >
            <Copy className="size-4" /> Copy item ID
          </button>
        ) : null}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-[#1D2981]/10 px-3 py-1.5 text-sm text-[#1D2981] hover:bg-[#1D2981]/20"
          onClick={handleActionClick("change-status")}
        >
          <Ellipsis className="size-4" /> Change status
        </button>
      </div>
    </article>
  );
}
