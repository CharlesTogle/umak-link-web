"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import { POST_REJECTION_REASONS } from "@/config/constants";
import { useLinkedPost, usePostCustodyHistory, usePostDetail } from "@/hooks/queries/post-queries";
import { normalizeValue, toDisplayLabel } from "@/lib/format-utils";
import { buildPostRejectionNotificationCopy } from "@/lib/post-rejection";
import {
  getPostRecordStatusChangeDecision,
  isEditableClaimedCustodyStatus,
  getPostRecordItemStatusOptions,
  isPostRecordItemStatusAllowed,
  isPostRecordPostStatusAllowed,
  POST_RECORD_CLAIMED_CUSTODY_STATUS_OPTIONS,
  POST_RECORD_POST_STATUS_OPTIONS,
  resolvePostRecordSelectedCustodyStatus,
  resolvePostRecordSelectedItemStatus,
  resolvePostRecordSelectedStatus,
  shouldShowPostRecordClaimedCustodyOptions,
  togglePostRecordCustodyStatusSelection,
  togglePostRecordItemStatusSelection,
  togglePostRecordStatusSelection,
} from "@/lib/post-record-status-rules";
import { shareLink } from "@/lib/share-link";
import { deleteClaimByItem } from "@/services/claims-service";
import { sendNotification } from "@/services/notifications-service";
import { updateItemStatus, updatePostStatus } from "@/services/posts-service";
import {
  markPostReceivedInSecurityOffice,
  notifyGuardForCustodyFollowUp,
  openPostCustodyInvestigation,
  updateClaimedItemCustodyStatus,
} from "@/services/staff-custody-service";
import {
  LinkedPostPanel,
  PostRecordCustodyPanel,
  PostRecordDetailHeader,
  PostRecordDetailsPanel,
  PostRecordMainPanel,
  PostRecordStatusPanel,
} from "@/components/staff/post-record-detail-view-sections";
import { PostRecordModals } from "@/components/staff/post-record-detail-view-modals";
import { postRecordDetailUiReducer } from "@/components/staff/post-record-detail-view-state";
import type {
  ApiCustodyStatus,
  ApiItemStatus,
  ApiPostStatus,
} from "@/types/post-record-api";
import type { LinkedPostRecord, ToastTone } from "@/types/ui";

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

function getLinkedOwnerName(linkedPost: LinkedPostRecord): string {
  return linkedPost.poster_name ?? "Unknown User";
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
      const rejectionNotificationCopy = buildPostRejectionNotificationCopy({
        itemName: params.itemName,
        rejectionReason: params.rejectionReason,
      });
      notifications.push({
        user_id: params.posterId,
        title: "Post Rejected",
        body: rejectionNotificationCopy.body,
        description: rejectionNotificationCopy.description,
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
    selectedCustodyStatus: null,
  });

  const normalizedPostStatus = normalizeValue(record?.post_status) as ApiPostStatus;
  const normalizedItemStatus = normalizeValue(record?.item_status) as ApiItemStatus;
  const normalizedCustodyStatus = normalizeValue(record?.custody_status) as ApiCustodyStatus;
  const isFoundItem = normalizeValue(record?.item_type) === "found";
  const custodyHistoryQuery = usePostCustodyHistory(postId, Boolean(record) && isFoundItem);
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

  const canNotifyOwner = record && normalizeValue(record.item_type) === "missing" && normalizedItemStatus === "lost";
  const canNotifyGuard = Boolean(record && isFoundItem && normalizedCustodyStatus === "under_investigation");
  const canReceiveInSecurityOffice = Boolean(
    record &&
      isFoundItem &&
      (normalizedCustodyStatus === "with_guard" || normalizedCustodyStatus === "under_investigation")
  );
  const canOpenInvestigation = Boolean(record && isFoundItem && normalizedCustodyStatus === "with_guard");
  const canClaimItem =
    Boolean(
      record &&
        isFoundItem &&
        normalizedItemStatus === "unclaimed" &&
        normalizedPostStatus === "accepted" &&
        normalizedCustodyStatus === "in_security_office"
    );
  const pendingFoundDecisionAllowedForRecord =
    !record ||
    !isFoundItem ||
    normalizedPostStatus !== "pending" ||
    normalizedCustodyStatus === "in_security_office";
  const selectedStatus = resolvePostRecordSelectedStatus(normalizedPostStatus, ui.selectedStatus);
  const selectedItemStatus = resolvePostRecordSelectedItemStatus(normalizedItemStatus, ui.selectedItemStatus);
  const selectedCustodyStatus = resolvePostRecordSelectedCustodyStatus(
    normalizedCustodyStatus,
    ui.selectedCustodyStatus
  );
  const showCustodyStatusSection = Boolean(
    record &&
      shouldShowPostRecordClaimedCustodyOptions(record.item_type, normalizedItemStatus)
  );
  const showItemStatusSection = !showCustodyStatusSection;
  const statusHelpText =
    record && isFoundItem && normalizedPostStatus === "pending" && normalizedCustodyStatus !== "in_security_office"
      ? "Pending found posts can be accepted or rejected only after the item is marked as received in the Security Office."
      : null;

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
      if (
        showCustodyStatusSection &&
        ui.selectedCustodyStatus &&
        ui.selectedCustodyStatus !== normalizedCustodyStatus
      ) {
        await updateClaimedItemCustodyStatus(Number(record.post_id), ui.selectedCustodyStatus);
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
      if (isFoundItem) {
        await custodyHistoryQuery.refetch();
      }
      setToast("Status changed successfully.", "success");
      dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
      dispatchUi({ type: "clear_selection" });
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to update status", "danger");
    } finally {
      dispatchUi({ type: "set_submitting", value: false });
      dispatchUi({ type: "set_modal", modal: "showUnclaimModal", value: false });
    }
  }, [custodyHistoryQuery, isFoundItem, linkedPostQuery, normalizedCustodyStatus, normalizedItemStatus, normalizedPostStatus, postQuery, record, setToast, showCustodyStatusSection, ui.isSubmitting, ui.selectedCustodyStatus, ui.selectedItemStatus, ui.selectedStatus]);

  const handleApplyStatusChange = async () => {
    if (!record) return;
    const decision = getPostRecordStatusChangeDecision({
      currentItemStatus: normalizedItemStatus,
      selectedPostStatus: ui.selectedStatus,
      selectedItemStatus: ui.selectedItemStatus,
      selectedCustodyStatus: ui.selectedCustodyStatus,
    });

    if (decision.type === "missing_selection") {
      setToast("Please select at least one status", "danger");
      return;
    }

    if (decision.type === "claim") {
      if (!canClaimItem) {
        setToast("Found items can be claimed only after Security Office receipt.", "danger");
        return;
      }
      router.push(`/staff/post/claim/${record.post_id}`);
      return;
    }

    if (
      isFoundItem &&
      normalizedPostStatus === "pending" &&
      (ui.selectedStatus === "accepted" || ui.selectedStatus === "rejected") &&
      normalizedCustodyStatus !== "in_security_office"
    ) {
      setToast("Pending found posts can be accepted or rejected only after Security Office receipt.", "danger");
      return;
    }

    if (decision.type === "reject") {
      dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
      dispatchUi({ type: "set_modal", modal: "showRejectModal", value: true });
      return;
    }

    if (decision.type === "confirm_unclaim") {
      dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
      dispatchUi({ type: "set_modal", modal: "showUnclaimModal", value: true });
      return;
    }

    await performStatusChange();
  };

  const handleRejectWithReason = async (reason: string) => {
    if (!record || ui.isSubmitting) return;
    if (
      isFoundItem &&
      normalizedPostStatus === "pending" &&
      normalizedCustodyStatus !== "in_security_office"
    ) {
      setToast("Pending found posts can be accepted or rejected only after Security Office receipt.", "danger");
      dispatchUi({ type: "set_modal", modal: "showRejectModal", value: false });
      return;
    }
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
      if (
        showCustodyStatusSection &&
        ui.selectedCustodyStatus &&
        ui.selectedCustodyStatus !== normalizedCustodyStatus
      ) {
        await updateClaimedItemCustodyStatus(Number(record.post_id), ui.selectedCustodyStatus);
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
      if (isFoundItem) {
        await custodyHistoryQuery.refetch();
      }
      setToast("Status changed successfully.", "success");
      dispatchUi({ type: "clear_selection" });
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

  const handleReceiveInSecurityOffice = async () => {
    if (!record || ui.isSubmitting) return;
    dispatchUi({ type: "set_submitting", value: true });
    try {
      await markPostReceivedInSecurityOffice(Number(record.post_id));
      await postQuery.refetch();
      await linkedPostQuery.refetch();
      await custodyHistoryQuery.refetch();
      setToast("Item marked as received in the Security Office.", "success");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to mark item as received", "danger");
    } finally {
      dispatchUi({ type: "set_submitting", value: false });
    }
  };

  const handleOpenInvestigation = async () => {
    if (!record || ui.isSubmitting) return;
    dispatchUi({ type: "set_submitting", value: true });
    try {
      await openPostCustodyInvestigation(Number(record.post_id));
      await postQuery.refetch();
      await linkedPostQuery.refetch();
      await custodyHistoryQuery.refetch();
      setToast("Custody investigation opened.", "success");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to open investigation", "danger");
    } finally {
      dispatchUi({ type: "set_submitting", value: false });
    }
  };

  const handleNotifyGuard = async () => {
    if (!record || ui.isSubmitting) return;
    dispatchUi({ type: "set_submitting", value: true });
    try {
      await notifyGuardForCustodyFollowUp(Number(record.post_id));
      setToast("Guard notified successfully.", "success");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to notify guard", "danger");
    } finally {
      dispatchUi({ type: "set_submitting", value: false });
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
    const errorMessage = postQuery.error instanceof Error ? postQuery.error.message : "No record found";
    return <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">{errorMessage}</h1></div></section>;
  }

  return (
    <PhotoProvider>
      <section className="grid h-full min-h-0 auto-rows-max grid-cols-1 gap-4 overflow-y-auto pr-1">
        <PostRecordDetailHeader
          canNotifyOwner={Boolean(canNotifyOwner)}
          canNotifyGuard={canNotifyGuard}
          canClaimItem={canClaimItem}
          canReceiveInSecurityOffice={canReceiveInSecurityOffice}
          canOpenInvestigation={canOpenInvestigation}
          record={record}
          onBack={() => router.push("/staff/post-records")}
          onShare={() => void handleShare()}
          onNotify={() => dispatchUi({ type: "set_modal", modal: "showNotifyModal", value: true })}
          onNotifyGuard={() => void handleNotifyGuard()}
          onClaim={() => router.push(`/staff/post/claim/${record.post_id}`)}
          onReceiveInSecurityOffice={() => void handleReceiveInSecurityOffice()}
          onOpenInvestigation={() => void handleOpenInvestigation()}
          onChangeStatus={() => dispatchUi({ type: "set_modal", modal: "showStatusModal", value: true })}
        />
        <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
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
        {isFoundItem ? (
          <PostRecordCustodyPanel
            history={custodyHistoryQuery.data ?? null}
            isLoading={custodyHistoryQuery.isLoading}
            errorMessage={custodyHistoryQuery.error instanceof Error ? custodyHistoryQuery.error.message : null}
          />
        ) : null}
        <PostRecordModals
          showStatusModal={ui.showStatusModal}
          showRejectModal={ui.showRejectModal}
          showUnclaimModal={ui.showUnclaimModal}
          showNotifyModal={ui.showNotifyModal}
          isSubmitting={ui.isSubmitting}
          selectedStatus={selectedStatus}
          selectedItemStatus={selectedItemStatus}
          selectedCustodyStatus={selectedCustodyStatus}
          postItemType={record.item_type}
          postStatusOptions={POST_RECORD_POST_STATUS_OPTIONS}
          claimedCustodyStatusOptions={POST_RECORD_CLAIMED_CUSTODY_STATUS_OPTIONS}
          rejectReasons={POST_REJECTION_REASONS}
          statusHelpText={statusHelpText}
          showItemStatusSection={showItemStatusSection}
          showCustodyStatusSection={showCustodyStatusSection}
          getStatusChipClass={getStatusChipClass}
          isPostStatusAllowed={(postStatus, selectedItemStatus) =>
            isPostRecordPostStatusAllowed(postStatus, selectedItemStatus) &&
            ((postStatus !== "accepted" && postStatus !== "rejected") || pendingFoundDecisionAllowedForRecord)
          }
          isItemStatusAllowed={isPostRecordItemStatusAllowed}
          getItemStatusOptions={getPostRecordItemStatusOptions}
          onSelectStatus={(value) =>
            dispatchUi({
              type: "set_selected_status",
              value: togglePostRecordStatusSelection(normalizedPostStatus, value),
            })
          }
          onSelectItemStatus={(value) =>
            dispatchUi({
              type: "set_selected_item_status",
              value: togglePostRecordItemStatusSelection(normalizedItemStatus, value),
            })
          }
          onSelectCustodyStatus={(value) =>
            dispatchUi({
              type: "set_selected_custody_status",
              value: togglePostRecordCustodyStatusSelection(
                isEditableClaimedCustodyStatus(normalizedCustodyStatus) ? normalizedCustodyStatus : null,
                value
              ),
            })
          }
          onCancelStatus={() => {
            dispatchUi({ type: "set_modal", modal: "showStatusModal", value: false });
            dispatchUi({ type: "clear_selection" });
          }}
          onApplyStatusChange={() => void handleApplyStatusChange()}
          onReject={(reason) => void handleRejectWithReason(reason)}
          onCancelReject={() => {
            dispatchUi({ type: "set_modal", modal: "showRejectModal", value: false });
            dispatchUi({ type: "clear_selection" });
          }}
          onCancelUnclaim={() => {
            dispatchUi({ type: "set_modal", modal: "showUnclaimModal", value: false });
            dispatchUi({ type: "clear_selection" });
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
