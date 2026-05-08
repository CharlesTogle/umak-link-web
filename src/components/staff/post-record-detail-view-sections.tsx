"use client";

import Image from "next/image";
import { ArrowLeft, CircleUserRound, Copy, Handshake, Mail, RefreshCcw, Share2 } from "lucide-react";
import { PhotoView } from "react-photo-view";
import { StaffPosterName } from "@/components/staff/staff-poster-name";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { toDisplayLabel } from "@/lib/format-utils";
import type { ApiItemStatus, ApiPostRecordDetails } from "@/types/post-record-api";
import type { LinkedPostRecord } from "@/types/ui";

export function PostRecordDetailHeader(props: {
  canNotifyOwner: boolean;
  canClaimItem: boolean;
  record: ApiPostRecordDetails;
  onBack: () => void;
  onShare: () => void;
  onNotify: () => void;
  onClaim: () => void;
  onChangeStatus: () => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={props.onBack} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="size-4" /> Back to Post Records
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={props.onShare} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Share2 className="size-4" /> Share
          </button>
          {props.canNotifyOwner ? (
            <button type="button" onClick={props.onNotify} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100">
              <Mail className="size-4" /> Notify owner
            </button>
          ) : null}
          {props.canClaimItem ? (
            <button type="button" onClick={props.onClaim} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100">
              <Handshake className="size-4" /> Claim item
            </button>
          ) : null}
          <button type="button" onClick={props.onChangeStatus} className="inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]">
            <RefreshCcw className="size-4" /> Change status
          </button>
        </div>
      </div>
    </article>
  );
}

export function PostRecordStatusPanel(props: { record: ApiPostRecordDetails; getStatusColor: (status: string) => string }) {
  return (
    <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4 lg:col-start-9 lg:row-start-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Post Status</p>
          <p className={`text-2xl font-bold ${props.getStatusColor(props.record.post_status)}`}>{toDisplayLabel(props.record.post_status)}</p>
          <p className="mt-1 text-sm text-slate-500">This post has been {toDisplayLabel(props.record.post_status).toLowerCase()}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">Item Status: {toDisplayLabel(props.record.item_status)}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">Item Type: {toDisplayLabel(props.record.item_type)}</span>
        </div>
      </div>
    </article>
  );
}

export function PostRecordMainPanel(props: { record: ApiPostRecordDetails; linkedPost: LinkedPostRecord | null }) {
  return (
    <article className={`min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8 lg:col-start-1 ${props.linkedPost ? "lg:row-start-1" : "lg:row-span-2"}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
          {props.record.poster_profile_picture_url ? (
            <Image src={props.record.poster_profile_picture_url} alt={props.record.poster_name} width={40} height={40} unoptimized className="size-full object-cover" />
          ) : (
            <CircleUserRound className="size-5" />
          )}
        </div>
        <div>
          <StaffPosterName
            name={props.record.poster_name}
            isAnonymous={props.record.is_anonymous}
            nameClassName="text-sm font-semibold text-slate-900"
          />
          <p className="text-xs text-slate-500">Submitted {formatDateTimeInPhilippineTime(props.record.submitted_on_date_local, "Unknown")}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{props.record.item_name}</h1>
      <p className="mt-2 text-sm text-slate-600">{props.record.item_description ?? "No description provided."}</p>

      {props.record.item_image_url ? (
        <PhotoView src={props.record.item_image_url}>
          <div className="relative mt-4 h-64 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 md:h-80">
            <Image src={props.record.item_image_url} alt={props.record.item_name} fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
          </div>
        </PhotoView>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
        <p><span className="font-medium text-slate-700">Category:</span> {props.record.category ?? "N/A"}</p>
        <p><span className="font-medium text-slate-700">Last seen location:</span> {props.record.last_seen_location ?? "N/A"}</p>
        <p><span className="font-medium text-slate-700">Last seen at:</span> {formatDateTimeInPhilippineTime(props.record.last_seen_at, "N/A")}</p>
      </div>
    </article>
  );
}

export function LinkedPostPanel(props: {
  linkedPost: LinkedPostRecord;
  isLinkedLoading: boolean;
  normalizedItemStatus: ApiItemStatus;
  getLinkedOwnerName: (linkedPost: LinkedPostRecord) => string;
  getLinkedPostAvatar: (linkedPost: LinkedPostRecord) => string | null;
  onViewLinkedPost: () => void;
}) {
  const avatar = props.getLinkedPostAvatar(props.linkedPost);
  return (
    <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8 lg:col-start-1 lg:row-start-2">
      <p className="text-sm font-semibold text-[#1D2981]">{props.normalizedItemStatus === "returned" ? "Claimed Item" : "Returned Item"}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        <div className="relative h-36 w-52 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {props.isLinkedLoading ? (
            <div className="h-full w-full animate-pulse bg-slate-200" />
          ) : props.linkedPost.item_image_url ? (
            <PhotoView src={props.linkedPost.item_image_url}>
              <div className="relative h-full w-full cursor-zoom-in">
                <Image src={props.linkedPost.item_image_url} alt={props.linkedPost.item_name ?? "Linked post"} fill unoptimized className="object-cover" sizes="208px" />
              </div>
            </PhotoView>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
          )}
        </div>
        <div className="min-w-[220px] flex-1 text-sm text-slate-600">
          <p className="text-lg font-semibold text-slate-900">{props.linkedPost.item_name ?? "Untitled item"}</p>
          <p className="mt-1">{props.linkedPost.item_description ?? "No description provided."}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Owner:</span>
            <StaffPosterName
              name={props.getLinkedOwnerName(props.linkedPost)}
              isAnonymous={props.linkedPost.is_anonymous}
              nameClassName="text-xs text-slate-500"
              badgeClassName="text-[10px]"
            />
          </p>
          <p className="text-xs text-slate-500"><span className="font-medium text-slate-700">Post ID:</span> {String(props.linkedPost.post_id)}</p>
          <div className="mt-3">
            <button type="button" onClick={props.onViewLinkedPost} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
              <Copy className="size-3.5" /> View linked post
            </button>
          </div>
        </div>
        {avatar ? (
          <div className="hidden md:block">
            <div className="size-12 overflow-hidden rounded-full border border-slate-200">
              <Image src={avatar} alt={props.getLinkedOwnerName(props.linkedPost)} width={48} height={48} unoptimized className="size-full object-cover" />
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PostRecordDetailsPanel(props: { record: ApiPostRecordDetails; normalizedItemStatus: ApiItemStatus }) {
  return (
    <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4 lg:col-start-9 lg:row-start-2">
      <h2 className="text-lg font-semibold text-slate-900">Post Details</h2>
      <p className="mt-1 text-sm text-slate-600">Submission and acceptance information for this post.</p>
      <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600">
        <p><span className="font-medium text-slate-700">Item Type:</span> {toDisplayLabel(props.record.item_type)}</p>
        <p><span className="font-medium text-slate-700">Submitted:</span> {formatDateTimeInPhilippineTime(props.record.submitted_on_date_local, "Unknown")}</p>
        {props.record.accepted_on_date_local ? <p><span className="font-medium text-slate-700">Accepted:</span> {formatDateTimeInPhilippineTime(props.record.accepted_on_date_local)}</p> : null}
        {props.record.rejection_reason ? <p><span className="font-medium text-slate-700">Rejection reason:</span> {props.record.rejection_reason}</p> : null}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">Poster Details</h3>
      <p className="mt-1 text-sm text-slate-600">Contact information of the user who posted this item.</p>
      <div className="mt-2 text-sm text-slate-600">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-700">Name:</span>
          <StaffPosterName
            name={props.record.poster_name}
            isAnonymous={props.record.is_anonymous}
            nameClassName="text-slate-600"
          />
        </p>
        <p><span className="font-medium text-slate-700">Email:</span> {props.record.poster_email}</p>
      </div>
      {props.record.claimer_name || props.normalizedItemStatus === "returned" ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">{props.normalizedItemStatus === "returned" ? "Return Details" : "Claim Details"}</h3>
          <p className="mt-1 text-sm text-slate-600">{props.normalizedItemStatus === "returned" ? "Information about who returned this item and when." : "Information about who claimed this item and when."}</p>
          {props.record.claimer_name && props.normalizedItemStatus !== "unclaimed" ? (
            <div className="mt-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{props.normalizedItemStatus === "returned" ? "Returned by" : "Claimer"}</p>
              <p><span className="font-medium text-slate-700">Name:</span> {props.record.claimer_name}</p>
              <p><span className="font-medium text-slate-700">Email:</span> {props.record.claimer_school_email ?? "No email provided"}</p>
              {props.record.claimer_contact_num ? <p><span className="font-medium text-slate-700">Contact:</span> {props.record.claimer_contact_num}</p> : null}
              <p className="mt-1 text-xs text-slate-500">{props.normalizedItemStatus === "returned" ? "Returned at" : "Claimed at"}: {formatDateTimeInPhilippineTime(props.normalizedItemStatus === "returned" ? props.record.returned_at : props.record.claimed_at, "Unknown")}</p>
            </div>
          ) : null}
          {props.record.claim_processed_by_name ? (
            <div className="mt-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Claim Processed by</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
                  {props.record.claim_processed_by_profile_picture_url ? (
                    <Image src={props.record.claim_processed_by_profile_picture_url} alt={props.record.claim_processed_by_name} width={32} height={32} unoptimized className="size-full object-cover" />
                  ) : (
                    <CircleUserRound className="size-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{props.record.claim_processed_by_name}</p>
                  <p className="text-xs text-slate-500">{props.record.claim_processed_by_email}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
