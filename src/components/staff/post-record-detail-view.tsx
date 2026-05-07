"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import { useLinkedPost, usePostDetail } from "@/hooks/queries/post-queries";
import { normalizeValue, toDisplayLabel } from "@/lib/format-utils";
import { shareLink } from "@/lib/share-link";
import { deleteClaimByItem } from "@/services/claims-service";
import { sendNotification } from "@/services/notifications-service";
import { updateItemStatus, updatePostStatus } from "@/services/posts-service";
import {
  LinkedPostPanel,
  PostRecordDetailHeader,
  PostRecordDetailsPanel,
  PostRecordMainPanel,
  PostRecordStatusPanel,
} from "@/components/staff/post-record-detail-view-sections";
import { PostRecordModals } from "@/components/staff/post-record-detail-view-modals";
import { postRecordDetailUiReducer } from "@/components/staff/post-record-detail-view-state";
import type { ApiItemStatus, ApiPostStatus } from "@/types/post-record-api";
import type { LinkedPostRecord, ToastTone } from "@/types/ui";

const POST_STATUS_OPTIONS: ApiPostStatus[] = ["pending", "accepted", "rejected"];
const REJECT_REASONS = [
  "Item is not identified in storage.",
  "Details don't match the item in question.",
  "This is a spam or malicious post.",
  "There is more than 1 instance of this post.",
  "Item has been discarded.",
] as const;

function getStatusColor(status: string): string {
  const normalized = normalizeValue(status);
  if (normalized === "accepted") return "text-emerald-600";
  if (normalized === "rejected" || normalized === "discarded" || normalized === "fraud") return "text-rose-700";
  if (normalized === "claimed" || normalized === "returned") return "text-blue-700";
  return "text-amber-600";
}

function getStatusChipClass(active: boolean, disabled = false): string {
  if (active) return "border-[#1D2981] bg-[#1D2981] text-white";
  if (disabled) return "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";
  return "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
}

function getItemStatusOptions(itemType: string | undefined): ApiItemStatus[] {
  return itemType === "found" ? ["claimed", "unclaimed", "discarded"] : ["returned", "lost"];
}

function isItemStatusAllowed(itemStatus: ApiItemStatus, selectedPostStatus: ApiPostStatus | null): boolean {
  if (!selectedPostStatus) return true;
  if (selectedPostStatus === "pending") return itemStatus === "unclaimed";
  if (selectedPostStatus === "rejected") return itemStatus === "unclaimed" || itemStatus === "discarded";
  return true;
}

function isPostStatusAllowed(postStatus: ApiPostStatus, selectedItemStatus: ApiItemStatus | null): boolean {
  if (!selectedItemStatus) return true;
  if (selectedItemStatus === "claimed" || selectedItemStatus === "returned") return postStatus === "accepted";
  if (selectedItemStatus === "discarded") return postStatus === "accepted" || postStatus === "rejected";
  return true;
}

function getLinkedOwnerName(linkedPost: LinkedPostRecord): string {
  return linkedPost.is_anonymous ? "Anonymous" : linkedPost.poster_name ?? "Unknown User";
}

function getLinkedPostAvatar(linkedPost: LinkedPostRecord): string | null {
  return linkedPost.poster_profile_picture_url ?? null;
}

function buildStatusChangeNotifications(params: {
  posterId: string | null | undefined;
  postId: string | number;
  itemName: string;
  imageUrl?: string | null;
  previousPostStatus: ApiPostStatus;
  nextPostStatus: ApiPostStatus;
  previousItemStatus: ApiItemStatus;
  nextItemStatus: ApiItemStatus;
  rejectionReason?: string;
}) {
  if (!params.posterId) return [];

  const notifications: Array<{
    user_id: string;
    title: string;
    body: string;
    description?: string;
    type: string;
    data: Record<string, unknown>;
    image_url?: string;
  }> = [];

  const notificationData = {
    postId: String(params.postId),
  };

  if (
    params.nextPostStatus !== params.previousPostStatus ||
    params.rejectionReason
  ) {
    if (params.nextPostStatus === "accepted") {
      notifications.push({
        user_id: params.posterId,
        title: "Post Accepted",
        body: `Your post about "${params.itemName}" has been accepted and is now visible on the platform.`,
        description: "Your post is now visible on the platform.",
        type: "acceptance",
        data: notificationData,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      });
    } else if (params.nextPostStatus === "rejected") {
      notifications.push({
        user_id: params.posterId,
        title: "Post Rejected",
        body: `Your post about "${params.itemName}" has been rejected and will not be published on the platform. You can edit and submit again or delete it. Reason: ${params.rejectionReason ?? "No reason provided."}`,
        description: params.rejectionReason ?? "Post rejected",
        type: "rejection",
        data: notificationData,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      });
    } else if (params.nextPostStatus === "pending") {
      notifications.push({
        user_id: params.posterId,
        title: "Post Status Updated",
        body: `The status of your post "${params.itemName}" has been changed to pending.`,
        description: "Your post status has been changed to pending.",
        type: "progress",
        data: notificationData,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      });
    }
  }

  if (params.nextItemStatus !== params.previousItemStatus) {
    if (params.nextItemStatus === "discarded") {
      notifications.push({
        user_id: params.posterId,
        title: "Item Discarded",
        body: `The item "${params.itemName}" has been discarded and is no longer available for claim.`,
        description: "This item is no longer available for claim.",
        type: "delete",
        data: notificationData,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      });
    } else if (
      params.previousItemStatus === "discarded" &&
      params.nextItemStatus === "unclaimed"
    ) {
      notifications.push({
        user_id: params.posterId,
        title: "Item Retrieved",
        body: `Great news! The item "${params.itemName}" that was previously discarded has been retrieved and is now ready to be claimed again.`,
        description: "This item is now ready to be claimed again.",
        type: "success",
        data: notificationData,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      });
    } else {
      notifications.push({
        user_id: params.posterId,
        title: "Item Status Updated",
        body: `The status of your item "${params.itemName}" has been changed to ${toDisplayLabel(
          params.nextItemStatus
        ).toLowerCase()}.`,
        description: `Item status changed to ${toDisplayLabel(params.nextItemStatus).toLowerCase()}.`,
        type: "info",
        data: notificationData,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      });
    }
  }

  return notifications;
}

export function PostRecordDetailView({ postId }: { postId: string }) {
  const router = useRouter();
  const postQuery = usePostDetail(postId);
  const record = postQuery.data ?? null;
  const linkedPostQuery = useLinkedPost(record, postId);
  const linkedPost = linkedPostQuery.data ?? null;
  const [ui, dispatchUi] = useReducer(postRecordDetailUiReducer, {
    isSubmitting: false,
    toast: null,
    showStatusModal: false,
    showRejectModal: false,
    showUnclaimModal: false,
    showNotifyModal: false,
    selectedStatus: null,
    selectedItemStatus: null,
  });

  const normalizedPostStatus = normalizeValue(record?.post_status) as ApiPostStatus;
  const normalizedItemStatus = normalizeValue(record?.item_status) as ApiItemStatus;
  const setToast = useCallback((message: string, tone: ToastTone) => {
    dispatchUi({ type: "set_toast", value: { message, tone } });
  }, []);

  useEffect(() => {
    if (!ui.toast) return;
    const timer = window.setTimeout(() => dispatchUi({ type: "set_toast", value: null }), 3000);
    return () => window.clearTimeout(timer);
  }, [ui.toast]);

  useEffect(() => {
    if (postQuery.error) setToast("Failed to load post record", "danger");
  }, [postQuery.error, setToast]);

  useEffect(() => {
    if (!record) return;
    dispatchUi({
      type: "reset_selection",
      postStatus: normalizeValue(record.post_status) as ApiPostStatus,
      itemStatus: normalizeValue(record.item_status) as ApiItemStatus,
    });
  }, [record]);

  const resetStatusSelection = useCallback(() => {
    if (!record) return;
    dispatchUi({
      type: "reset_selection",
      postStatus: normalizeValue(record.post_status) as ApiPostStatus,
      itemStatus: normalizeValue(record.item_status) as ApiItemStatus,
    });
  }, [record]);

  const canNotifyOwner = record && normalizeValue(record.item_type) === "missing" && normalizedItemStatus === "lost";
  const canClaimItem =
    record && normalizeValue(record.item_type) === "found" && normalizedItemStatus === "unclaimed" && normalizedPostStatus === "accepted";

  const performStatusChange = useCallback(async () => {
    if (!record || ui.isSubmitting) return;
    dispatchUi({ type: "set_submitting", value: true });
    const nextPostStatus = ui.selectedStatus ?? normalizedPostStatus;
    const nextItemStatus = ui.selectedItemStatus ?? normalizedItemStatus;

    try {
      if (ui.selectedStatus && ui.selectedStatus !== normalizedPostStatus) {
        await updatePostStatus(String(record.post_id), { status: ui.selectedStatus });
      }
      if (ui.selectedItemStatus && ui.selectedItemStatus !== normalizedItemStatus) {
        if (!record.item_id) throw new Error("Item ID is missing");
        if (normalizedItemStatus === "claimed" && ui.selectedItemStatus !== "claimed") {
          await deleteClaimByItem(record.item_id);
        }
        await updateItemStatus(record.item_id, { status: ui.selectedItemStatus });
      }
      await Promise.allSettled(
        buildStatusChangeNotifications({
          posterId: record.poster_id,
          postId: record.post_id,
          itemName: record.item_name,
          imageUrl: record.item_image_url,
          previousPostStatus: normalizedPostStatus,
          nextPostStatus,
          previousItemStatus: normalizedItemStatus,
          nextItemStatus,
        }).map((notification) => sendNotification(notification))
      );
      await postQuery.refetch();
      await linkedPostQuery.refetch();
      setToast("Status changed successfully.", "success");
      dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to update status", "danger");
      resetStatusSelection();
    } finally {
      dispatchUi({ type: "set_submitting", value: false });
      dispatchUi({ type: "set_modal", modal: "showUnclaimModal", value: false });
    }
  }, [linkedPostQuery, normalizedItemStatus, normalizedPostStatus, postQuery, record, resetStatusSelection, setToast, ui.isSubmitting, ui.selectedItemStatus, ui.selectedStatus]);

  const handleApplyStatusChange = async () => {
    if (!record) return;
    if (!ui.selectedStatus && !ui.selectedItemStatus) return setToast("Please select at least one status", "danger");
    if (ui.selectedItemStatus === "claimed" && normalizedItemStatus !== "claimed") {
      router.push(`/staff/post/claim/${record.post_id}`);
      return;
    }
    if (ui.selectedStatus === "rejected") {
      dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
      dispatchUi({ type: "set_modal", modal: "showRejectModal", value: true });
      return;
    }
    if (normalizedItemStatus === "claimed" && ui.selectedItemStatus && ui.selectedItemStatus !== "claimed") {
      dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
      dispatchUi({ type: "set_modal", modal: "showUnclaimModal", value: true });
      return;
    }
    await performStatusChange();
  };

  const handleRejectWithReason = async (reason: string) => {
    if (!record || ui.isSubmitting) return;
    dispatchUi({ type: "set_submitting", value: true });
    try {
      await updatePostStatus(String(record.post_id), { status: "rejected", rejection_reason: reason });
      if (ui.selectedItemStatus && ui.selectedItemStatus !== normalizedItemStatus) {
        if (!record.item_id) throw new Error("Item ID is missing");
        if (normalizedItemStatus === "claimed" && ui.selectedItemStatus !== "claimed") {
          await deleteClaimByItem(record.item_id);
        }
        await updateItemStatus(record.item_id, { status: ui.selectedItemStatus });
      }
      await Promise.allSettled(
        buildStatusChangeNotifications({
          posterId: record.poster_id,
          postId: record.post_id,
          itemName: record.item_name,
          imageUrl: record.item_image_url,
          previousPostStatus: normalizedPostStatus,
          nextPostStatus: "rejected",
          previousItemStatus: normalizedItemStatus,
          nextItemStatus: ui.selectedItemStatus ?? normalizedItemStatus,
          rejectionReason: reason,
        }).map((notification) => sendNotification(notification))
      );
      await postQuery.refetch();
      await linkedPostQuery.refetch();
      setToast("Status changed successfully.", "success");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to reject post", "danger");
    } finally {
      dispatchUi({ type: "set_submitting", value: false });
      dispatchUi({ type: "set_modal", modal: "showRejectModal", value: false });
    }
  };

  const handleNotifyOwner = async () => {
    dispatchUi({ type: "set_modal", modal: "showNotifyModal", value: false });
    if (!record) return;
    if (!record.poster_id) return setToast("Owner is unavailable for notification", "danger");
    try {
      await sendNotification({
        user_id: record.poster_id,
        title: "Great News! A Possible Match to Your Item",
        body: `We have identified items that may possibly match your ${record.item_name}. Please proceed to the Security Office during office hours to verify if any of them belong to you.`,
        description: "Please proceed to the Security Office during office hours.",
        type: "match",
        data: { postId: String(record.post_id), itemName: record.item_name },
      });
      setToast("Owner notified successfully!", "success");
    } catch {
      setToast("Failed to send notification to owner", "danger");
    }
  };

  const handleShare = async () => {
    if (!record) return;
    try {
      const shareResult = await shareLink({
        title: record.item_name,
        text: `View the ${record.item_name} post record.`,
        url: `${window.location.origin}/staff/post-record/view/${record.post_id}`,
      });

      if (shareResult === "copied") {
        setToast("Link copied to clipboard", "success");
      }

      if (shareResult === "shared") {
        setToast("Post shared successfully", "success");
      }
    } catch {
      setToast("Failed to share post", "danger");
    }
  };

  if (postQuery.isLoading) {
    return <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" /><div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" /></div><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="h-6 w-64 animate-pulse rounded-full bg-slate-200" /><div className="mt-4 h-56 animate-pulse rounded-2xl bg-slate-100" /></div></section>;
  }
  if (!record) {
    return <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">No record found</h1></div></section>;
  }

  return (
    <PhotoProvider>
      <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-1">
        <PostRecordDetailHeader
          canNotifyOwner={Boolean(canNotifyOwner)}
          canClaimItem={Boolean(canClaimItem)}
          record={record}
          onBack={() => router.push("/staff/post-records")}
          onShare={() => void handleShare()}
          onNotify={() => dispatchUi({ type: "set_modal", modal: "showNotifyModal", value: true })}
          onClaim={() => router.push(`/staff/post/claim/${record.post_id}`)}
          onChangeStatus={() => dispatchUi({ type: "set_modal", modal: "showStatusModal", value: true })}
        />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          <PostRecordStatusPanel record={record} getStatusColor={getStatusColor} />
          <PostRecordMainPanel record={record} linkedPost={linkedPost} />
          {linkedPost ? (
            <LinkedPostPanel
              linkedPost={linkedPost}
              isLinkedLoading={linkedPostQuery.isLoading}
              normalizedItemStatus={normalizedItemStatus}
              getLinkedOwnerName={getLinkedOwnerName}
              getLinkedPostAvatar={getLinkedPostAvatar}
              onViewLinkedPost={() => router.push(`/staff/post-record/view/${linkedPost.post_id}`)}
            />
          ) : null}
          <PostRecordDetailsPanel record={record} normalizedItemStatus={normalizedItemStatus} />
        </div>
        <PostRecordModals
          showStatusModal={ui.showStatusModal}
          showRejectModal={ui.showRejectModal}
          showUnclaimModal={ui.showUnclaimModal}
          showNotifyModal={ui.showNotifyModal}
          isSubmitting={ui.isSubmitting}
          selectedStatus={ui.selectedStatus}
          selectedItemStatus={ui.selectedItemStatus}
          postItemType={record.item_type}
          postStatusOptions={POST_STATUS_OPTIONS}
          rejectReasons={REJECT_REASONS}
          getStatusChipClass={getStatusChipClass}
          isPostStatusAllowed={isPostStatusAllowed}
          isItemStatusAllowed={isItemStatusAllowed}
          getItemStatusOptions={getItemStatusOptions}
          onSelectStatus={(value) => dispatchUi({ type: "set_selected_status", value })}
          onSelectItemStatus={(value) => dispatchUi({ type: "set_selected_item_status", value })}
          onCancelStatus={() => {
            dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
            resetStatusSelection();
          }}
          onApplyStatusChange={() => void handleApplyStatusChange()}
          onReject={(reason) => void handleRejectWithReason(reason)}
          onCancelReject={() => {
            dispatchUi({ type: "set_modal", modal: "showRejectModal", value: false });
            resetStatusSelection();
          }}
          onCancelUnclaim={() => {
            dispatchUi({ type: "set_modal", modal: "showUnclaimModal", value: false });
            resetStatusSelection();
          }}
          onConfirmUnclaim={() => void performStatusChange()}
          onCancelNotify={() => dispatchUi({ type: "set_modal", modal: "showNotifyModal", value: false })}
          onConfirmNotify={() => void handleNotifyOwner()}
        />
        {ui.toast ? <div className={`fixed right-6 top-6 z-[60] rounded-2xl px-4 py-2 text-sm text-white shadow-lg ${ui.toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>{ui.toast.message}</div> : null}
      </section>
    </PhotoProvider>
  );
}
