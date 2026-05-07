import type { ApiItemStatus, ApiPostStatus } from "@/types/post-record-api";

export const POST_RECORD_POST_STATUS_OPTIONS: ApiPostStatus[] = ["pending", "accepted", "rejected"];

export type PostRecordStatusChangeDecision =
  | { type: "missing_selection" }
  | { type: "claim" }
  | { type: "reject" }
  | { type: "confirm_unclaim" }
  | { type: "apply" };

export function getPostRecordItemStatusOptions(itemType: string | undefined): ApiItemStatus[] {
  return itemType === "found" ? ["claimed", "unclaimed", "discarded"] : ["returned", "lost"];
}

export function isPostRecordItemStatusAllowed(
  itemStatus: ApiItemStatus,
  selectedPostStatus: ApiPostStatus | null
): boolean {
  if (!selectedPostStatus) return true;
  if (selectedPostStatus === "pending") return itemStatus === "unclaimed";
  if (selectedPostStatus === "rejected") return itemStatus === "unclaimed" || itemStatus === "discarded";
  return true;
}

export function isPostRecordPostStatusAllowed(
  postStatus: ApiPostStatus,
  selectedItemStatus: ApiItemStatus | null
): boolean {
  if (!selectedItemStatus) return true;
  if (selectedItemStatus === "claimed" || selectedItemStatus === "returned") return postStatus === "accepted";
  if (selectedItemStatus === "discarded") return postStatus === "accepted" || postStatus === "rejected";
  return true;
}

export function resolvePostRecordSelectedStatus(
  currentStatus: ApiPostStatus,
  selectedStatus: ApiPostStatus | null
): ApiPostStatus {
  return selectedStatus ?? currentStatus;
}

export function resolvePostRecordSelectedItemStatus(
  currentStatus: ApiItemStatus,
  selectedStatus: ApiItemStatus | null
): ApiItemStatus {
  return selectedStatus ?? currentStatus;
}

export function togglePostRecordStatusSelection(
  currentStatus: ApiPostStatus,
  nextStatus: ApiPostStatus
): ApiPostStatus | null {
  return nextStatus === currentStatus ? null : nextStatus;
}

export function togglePostRecordItemStatusSelection(
  currentStatus: ApiItemStatus,
  nextStatus: ApiItemStatus
): ApiItemStatus | null {
  return nextStatus === currentStatus ? null : nextStatus;
}

export function getPostRecordStatusChangeDecision(params: {
  currentItemStatus: ApiItemStatus;
  selectedPostStatus: ApiPostStatus | null;
  selectedItemStatus: ApiItemStatus | null;
}): PostRecordStatusChangeDecision {
  if (!params.selectedPostStatus && !params.selectedItemStatus) {
    return { type: "missing_selection" };
  }

  if (params.selectedItemStatus === "claimed" && params.currentItemStatus !== "claimed") {
    return { type: "claim" };
  }

  if (params.selectedPostStatus === "rejected") {
    return { type: "reject" };
  }

  if (
    params.currentItemStatus === "claimed" &&
    params.selectedItemStatus &&
    params.selectedItemStatus !== "claimed"
  ) {
    return { type: "confirm_unclaim" };
  }

  return { type: "apply" };
}
