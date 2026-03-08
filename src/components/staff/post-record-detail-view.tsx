"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleUserRound, Copy, Handshake, Mail, RefreshCcw, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { deleteClaimByItem } from "@/services/claims-service";
import { sendNotification } from "@/services/notifications-service";
import {
  getPostByItemDetails,
  getPostByItemId,
  getPostFull,
  listPosts,
  updateItemStatus,
  updatePostStatus,
} from "@/services/posts-service";
import type { ApiItemStatus, ApiPostRecord, ApiPostRecordDetails, ApiPostStatus } from "@/types/post-record-api";

type ToastTone = "success" | "danger";
type LinkedPostRecord = ApiPostRecord | ApiPostRecordDetails;

const POST_STATUS_OPTIONS: ApiPostStatus[] = ["pending", "accepted", "rejected"];

const REJECT_REASONS = [
  "Item is not identified in storage.",
  "Details don't match the item in question.",
  "This is a spam or malicious post.",
  "There is more than 1 instance of this post.",
  "Item has been discarded.",
] as const;

function toDisplayLabel(value: string | null | undefined, fallback = "Unknown"): string {
  if (!value) return fallback;
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function getStatusColor(status: string): string {
  const normalized = normalizeValue(status);
  if (normalized === "accepted") return "text-emerald-600";
  if (normalized === "rejected" || normalized === "discarded" || normalized === "fraud") return "text-rose-700";
  if (normalized === "claimed" || normalized === "returned") return "text-blue-700";
  return "text-amber-600";
}

function getStatusChipClass(active: boolean, disabled = false): string {
  if (active) {
    return "border-[#1D2981] bg-[#1D2981] text-white";
  }

  if (disabled) {
    return "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";
  }

  return "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
}

function getItemStatusOptions(itemType: string | undefined): ApiItemStatus[] {
  if (itemType === "found") {
    return ["claimed", "unclaimed", "discarded"];
  }
  return ["returned", "lost"];
}

function isItemStatusAllowed(itemStatus: ApiItemStatus, selectedPostStatus: ApiPostStatus | null): boolean {
  if (!selectedPostStatus) return true;

  if (selectedPostStatus === "pending") return itemStatus === "unclaimed";
  if (selectedPostStatus === "rejected") return itemStatus === "unclaimed" || itemStatus === "discarded";
  return true;
}

function isPostStatusAllowed(postStatus: ApiPostStatus, selectedItemStatus: ApiItemStatus | null): boolean {
  if (!selectedItemStatus) return true;

  if (selectedItemStatus === "claimed" || selectedItemStatus === "returned") {
    return postStatus === "accepted";
  }

  if (selectedItemStatus === "discarded") {
    return postStatus === "accepted" || postStatus === "rejected";
  }

  return true;
}

function getLinkedOwnerName(linkedPost: LinkedPostRecord): string {
  if (linkedPost.is_anonymous) return "Anonymous";
  return linkedPost.poster_name ?? "Unknown User";
}

function getLinkedPostAvatar(linkedPost: LinkedPostRecord): string | null {
  return linkedPost.poster_profile_picture_url ?? null;
}

function Overlay({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">{children}</div>;
}

export function PostRecordDetailView({ postId }: { postId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<ApiPostRecordDetails | null>(null);
  const [linkedPost, setLinkedPost] = useState<LinkedPostRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkedLoading, setIsLinkedLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUnclaimModal, setShowUnclaimModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<ApiPostStatus | null>(null);
  const [selectedItemStatus, setSelectedItemStatus] = useState<ApiItemStatus | null>(null);

  const normalizedPostStatus = useMemo(
    () => normalizeValue(record?.post_status) as ApiPostStatus,
    [record?.post_status]
  );
  const normalizedItemStatus = useMemo(
    () => normalizeValue(record?.item_status) as ApiItemStatus,
    [record?.item_status]
  );

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchLinkedPost = useCallback(async (currentRecord: ApiPostRecordDetails) => {
    setIsLinkedLoading(true);
    try {
      const itemType = normalizeValue(currentRecord.item_type);
      const itemStatus = normalizeValue(currentRecord.item_status);

      if (itemType === "found" && currentRecord.linked_lost_item_id) {
        const linkedMissingItem = await getPostByItemDetails(currentRecord.linked_lost_item_id);
        setLinkedPost(linkedMissingItem);
        return;
      }

      if (itemType === "missing" && itemStatus === "returned" && currentRecord.item_id) {
        const linkedFoundPosts = await listPosts({ linked_item_id: currentRecord.item_id, limit: 1 });
        setLinkedPost(linkedFoundPosts.posts[0] ?? null);
        return;
      }

      if (itemType === "missing" && itemStatus === "claimed" && currentRecord.item_id) {
        const linkedFoundItem = await getPostByItemId(currentRecord.item_id);
        setLinkedPost(linkedFoundItem);
        return;
      }

      setLinkedPost(null);
    } catch {
      setLinkedPost(null);
    } finally {
      setIsLinkedLoading(false);
    }
  }, []);

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const post = await getPostFull(postId);
      setRecord(post);
      setSelectedStatus(normalizeValue(post.post_status) as ApiPostStatus);
      setSelectedItemStatus(normalizeValue(post.item_status) as ApiItemStatus);
      await fetchLinkedPost(post);
    } catch {
      setRecord(null);
      showToast("Failed to load post record", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [fetchLinkedPost, postId, showToast]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const canNotifyOwner = record && normalizeValue(record.item_type) === "missing" && normalizedItemStatus === "lost";
  const canClaimItem =
    record &&
    normalizeValue(record.item_type) === "found" &&
    normalizedItemStatus === "unclaimed" &&
    normalizedPostStatus === "accepted";

  const resetStatusSelection = useCallback(() => {
    if (!record) return;
    setSelectedStatus(normalizeValue(record.post_status) as ApiPostStatus);
    setSelectedItemStatus(normalizeValue(record.item_status) as ApiItemStatus);
  }, [record]);

  const performStatusChange = useCallback(async () => {
    if (!record || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (selectedStatus && selectedStatus !== normalizedPostStatus) {
        await updatePostStatus(String(record.post_id), { status: selectedStatus });
      }

      if (selectedItemStatus && selectedItemStatus !== normalizedItemStatus) {
        if (!record.item_id) {
          throw new Error("Item ID is missing");
        }

        if (normalizedItemStatus === "claimed" && selectedItemStatus !== "claimed") {
          await deleteClaimByItem(record.item_id);
        }

        await updateItemStatus(record.item_id, { status: selectedItemStatus });
      }

      await loadPost();
      showToast("Status updated successfully", "success");
      setShowStatusModal(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update status", "danger");
      resetStatusSelection();
    } finally {
      setIsSubmitting(false);
      setShowUnclaimModal(false);
    }
  }, [
    isSubmitting,
    loadPost,
    normalizedItemStatus,
    normalizedPostStatus,
    record,
    resetStatusSelection,
    selectedItemStatus,
    selectedStatus,
    showToast,
  ]);

  const handleApplyStatusChange = async () => {
    if (!record) return;

    if (!selectedStatus && !selectedItemStatus) {
      showToast("Please select at least one status", "danger");
      return;
    }

    if (selectedItemStatus === "claimed" && normalizedItemStatus !== "claimed") {
      router.push(`/staff/post/claim/${record.post_id}`);
      return;
    }

    if (selectedStatus === "rejected") {
      setShowStatusModal(false);
      setShowRejectModal(true);
      return;
    }

    if (normalizedItemStatus === "claimed" && selectedItemStatus && selectedItemStatus !== "claimed") {
      setShowStatusModal(false);
      setShowUnclaimModal(true);
      return;
    }

    await performStatusChange();
  };

  const handleRejectWithReason = async (reason: string) => {
    if (!record || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updatePostStatus(String(record.post_id), { status: "rejected", rejection_reason: reason });
      await loadPost();
      showToast("Post rejected successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to reject post", "danger");
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
    }
  };

  const handleNotifyOwner = async () => {
    setShowNotifyModal(false);

    if (!record) return;
    if (!record.poster_id) {
      showToast("Owner is unavailable for notification", "danger");
      return;
    }

    try {
      await sendNotification({
        user_id: record.poster_id,
        title: "Great News! A Possible Match to Your Item",
        body: `We have identified items that may possibly match your ${record.item_name}. Please proceed to the Security Office during office hours to verify if any of them belong to you.`,
        description: "Please proceed to the Security Office during office hours.",
        type: "match",
        data: {
          postId: String(record.post_id),
          itemName: record.item_name,
          link: `/user/post/view/${record.post_id}`,
        },
      });
      showToast("Notification sent to owner successfully", "success");
    } catch {
      showToast("Failed to send notification to owner", "danger");
    }
  };

  const handleShare = async () => {
    if (!record) return;

    try {
      const shareUrl = `${window.location.origin}/staff/post-record/view/${record.post_id}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied to clipboard", "success");
    } catch {
      showToast("Failed to copy link", "danger");
    }
  };

  if (isLoading) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-6 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">No record found</h1>
          <button
            type="button"
            onClick={() => router.push("/staff/post-records")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]"
          >
            <ArrowLeft className="size-4" /> Go back
          </button>
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
            onClick={() => router.push("/staff/post-records")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" /> Back to Post Records
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Share2 className="size-4" /> Share
            </button>
            {canNotifyOwner ? (
              <button
                type="button"
                onClick={() => setShowNotifyModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100"
              >
                <Mail className="size-4" /> Notify owner
              </button>
            ) : null}
            {canClaimItem ? (
              <button
                type="button"
                onClick={() => router.push(`/staff/post/claim/${record.post_id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
              >
                <Handshake className="size-4" /> Claim item
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]"
            >
              <RefreshCcw className="size-4" /> Change status
            </button>
          </div>
        </div>
      </article>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
      <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4 lg:col-start-9 lg:row-start-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Post Status</p>
            <p className={`text-2xl font-bold ${getStatusColor(record.post_status)}`}>
              {toDisplayLabel(record.post_status)}
            </p>
            <p className="mt-1 text-sm text-slate-500">This post has been {toDisplayLabel(record.post_status).toLowerCase()}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Item Status: {toDisplayLabel(record.item_status)}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Item Type: {toDisplayLabel(record.item_type)}
            </span>
          </div>
        </div>
      </article>

      <article
        className={`min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8 lg:col-start-1 ${
          linkedPost ? "lg:row-start-1" : "lg:row-span-2"
        }`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
            {record.poster_profile_picture_url ? (
              <Image
                src={record.poster_profile_picture_url}
                alt={record.poster_name}
                width={40}
                height={40}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <CircleUserRound className="size-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{record.is_anonymous ? "Anonymous" : record.poster_name}</p>
            <p className="text-xs text-slate-500">
              Submitted {formatDateTimeInPhilippineTime(record.submitted_on_date_local, "Unknown")}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">{record.item_name}</h1>
        <p className="mt-2 text-sm text-slate-600">{record.item_description ?? "No description provided."}</p>

        {record.item_image_url ? (
          <PhotoView src={record.item_image_url}>
            <div className="relative mt-4 h-64 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 md:h-80">
              <Image
                src={record.item_image_url}
                alt={record.item_name}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          </PhotoView>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Category:</span> {record.category ?? "N/A"}
          </p>
          <p>
            <span className="font-medium text-slate-700">Last seen location:</span> {record.last_seen_location ?? "N/A"}
          </p>
          <p>
            <span className="font-medium text-slate-700">Last seen at:</span>{" "}
            {formatDateTimeInPhilippineTime(record.last_seen_at, "N/A")}
          </p>
        </div>
      </article>

      {linkedPost ? (
        <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8 lg:col-start-1 lg:row-start-2">
          <p className="text-sm font-semibold text-[#1D2981]">
            {normalizedItemStatus === "returned" ? "Claimed Item" : "Returned Item"}
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <div className="relative h-36 w-52 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {isLinkedLoading ? (
                <div className="h-full w-full animate-pulse bg-slate-200" />
              ) : linkedPost.item_image_url ? (
                <PhotoView src={linkedPost.item_image_url}>
                  <div className="relative h-full w-full cursor-zoom-in">
                    <Image
                      src={linkedPost.item_image_url}
                      alt={linkedPost.item_name ?? "Linked post"}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="208px"
                    />
                  </div>
                </PhotoView>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
              )}
            </div>
            <div className="min-w-[220px] flex-1 text-sm text-slate-600">
              <p className="text-lg font-semibold text-slate-900">{linkedPost.item_name ?? "Untitled item"}</p>
              <p className="mt-1">{linkedPost.item_description ?? "No description provided."}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Owner:</span> {getLinkedOwnerName(linkedPost)}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Post ID:</span> {String(linkedPost.post_id)}
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => router.push(`/staff/post-record/view/${linkedPost.post_id}`)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="size-3.5" /> View linked post
                </button>
              </div>
            </div>
            {getLinkedPostAvatar(linkedPost) ? (
              <div className="hidden md:block">
                <div className="size-12 overflow-hidden rounded-full border border-slate-200">
                  <Image
                    src={getLinkedPostAvatar(linkedPost) as string}
                    alt={getLinkedOwnerName(linkedPost)}
                    width={48}
                    height={48}
                    unoptimized
                    className="size-full object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}

      <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4 lg:col-start-9 lg:row-start-2">
        <h2 className="text-lg font-semibold text-slate-900">Post Details</h2>
        <p className="mt-1 text-sm text-slate-600">Submission and acceptance information for this post.</p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Item Type:</span> {toDisplayLabel(record.item_type)}
          </p>
          <p>
            <span className="font-medium text-slate-700">Submitted:</span>{" "}
            {formatDateTimeInPhilippineTime(record.submitted_on_date_local, "Unknown")}
          </p>
          {record.accepted_on_date_local ? (
            <p>
              <span className="font-medium text-slate-700">Accepted:</span>{" "}
              {formatDateTimeInPhilippineTime(record.accepted_on_date_local)}
            </p>
          ) : null}
          {record.rejection_reason ? (
            <p>
              <span className="font-medium text-slate-700">Rejection reason:</span> {record.rejection_reason}
            </p>
          ) : null}
        </div>

        <h3 className="mt-5 text-lg font-semibold text-slate-900">Poster Details</h3>
        <p className="mt-1 text-sm text-slate-600">Contact information of the user who posted this item.</p>
        <div className="mt-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Name:</span> {record.poster_name}
          </p>
          <p>
            <span className="font-medium text-slate-700">Email:</span> {record.poster_email}
          </p>
        </div>

        {record.claimer_name || normalizedItemStatus === "returned" ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {normalizedItemStatus === "returned" ? "Return Details" : "Claim Details"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {normalizedItemStatus === "returned"
                ? "Information about who returned this item and when."
                : "Information about who claimed this item and when."}
            </p>

            {record.claimer_name && normalizedItemStatus !== "unclaimed" ? (
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">
                  {normalizedItemStatus === "returned" ? "Returned by" : "Claimer"}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Name:</span> {record.claimer_name}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Email:</span>{" "}
                  {record.claimer_school_email ?? "No email provided"}
                </p>
                {record.claimer_contact_num ? (
                  <p>
                    <span className="font-medium text-slate-700">Contact:</span> {record.claimer_contact_num}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  {normalizedItemStatus === "returned" ? "Returned at" : "Claimed at"}: {" "}
                  {formatDateTimeInPhilippineTime(
                    normalizedItemStatus === "returned" ? record.returned_at : record.claimed_at,
                    "Unknown"
                  )}
                </p>
              </div>
            ) : null}

            {record.claim_processed_by_name ? (
              <div className="mt-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Claim Processed by</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
                    {record.claim_processed_by_profile_picture_url ? (
                      <Image
                        src={record.claim_processed_by_profile_picture_url}
                        alt={record.claim_processed_by_name}
                        width={32}
                        height={32}
                        unoptimized
                        className="size-full object-cover"
                      />
                    ) : (
                      <CircleUserRound className="size-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{record.claim_processed_by_name}</p>
                    <p className="text-xs text-slate-500">{record.claim_processed_by_email}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
      </div>

      {showStatusModal ? (
        <Overlay>
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Update Post Status</h2>
            <p className="mt-1 text-sm text-slate-600">Select post and item statuses to apply.</p>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Post Status</p>
              <div className="flex flex-wrap gap-2">
                {POST_STATUS_OPTIONS.map((status) => {
                  const allowed = isPostStatusAllowed(status, selectedItemStatus);
                  const active = selectedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setSelectedStatus(status)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${getStatusChipClass(active, !allowed)}`}
                    >
                      {toDisplayLabel(status)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Item Status</p>
              <div className="flex flex-wrap gap-2">
                {getItemStatusOptions(record.item_type).map((status) => {
                  const allowed = isItemStatusAllowed(status, selectedStatus);
                  const active = selectedItemStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setSelectedItemStatus(status)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${getStatusChipClass(active, !allowed)}`}
                    >
                      {toDisplayLabel(status)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  resetStatusSelection();
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleApplyStatusChange()}
                className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
              >
                {isSubmitting ? "Updating..." : "Apply Changes"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {showRejectModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Reject Post</h2>
            <p className="mt-2 text-sm text-slate-600">Select a reason to reject the post. Uploader will be notified.</p>
            <div className="mt-4 space-y-2">
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleRejectWithReason(reason)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  resetStatusSelection();
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {showUnclaimModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Confirm Unclaim Action</h2>
            <p className="mt-2 text-sm text-slate-600">
              This deletes the claim record and resets linked missing items back to lost status. Continue?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnclaimModal(false);
                  resetStatusSelection();
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void performStatusChange()}
                className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {showNotifyModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Notify Owner</h2>
            <p className="mt-2 text-sm text-slate-600">
              Notify the owner that similar items may be in the Security Office?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleNotifyOwner()}
                className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]"
              >
                Confirm
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {toast ? (
        <div
          className={`fixed right-6 top-6 z-[60] rounded-2xl px-4 py-2 text-sm text-white shadow-lg ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      </section>
    </PhotoProvider>
  );
}
