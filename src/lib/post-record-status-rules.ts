import type {
  ApiCustodyStatus,
  ApiEditableClaimedCustodyStatus,
  ApiEditablePostCustodyStatus,
  ApiEditableUntrackedCustodyStatus,
  ApiItemStatus,
  ApiPostStatus,
} from "@/types/post-record-api";

export const POST_RECORD_POST_STATUS_OPTIONS: ApiPostStatus[] = ["pending", "accepted", "rejected"];
export const POST_RECORD_CLAIMED_CUSTODY_STATUS_OPTIONS: ApiEditableClaimedCustodyStatus[] = [
  "in_security_office",
  "under_investigation",
  "claimed_by_student",
];
export const POST_RECORD_UNTRACKED_CUSTODY_STATUS_OPTIONS: ApiEditableUntrackedCustodyStatus[] = [
  "with_reporter",
  "with_guard",
  "in_security_office",
];

export type PostRecordStatusChangeDecision =
  | { type: "missing_selection" }
  | { type: "claim" }
  | { type: "reject" }
  | { type: "confirm_unclaim" }
  | { type: "apply" };

export function isEditablePostCustodyStatus(
  custodyStatus: ApiCustodyStatus | null | undefined
): custodyStatus is ApiEditablePostCustodyStatus {
  return (
    custodyStatus === "with_reporter" ||
    custodyStatus === "with_guard" ||
    custodyStatus === "in_security_office" ||
    custodyStatus === "under_investigation" ||
    custodyStatus === "claimed_by_student"
  );
}

export function getPostRecordItemStatusOptions(itemType: string | undefined): ApiItemStatus[] {
  return itemType === "found" ? ["claimed", "unclaimed", "discarded"] : ["returned", "lost"];
}

export function getPostRecordCustodyStatusOptions(
  itemType: string | undefined,
  itemStatus: ApiItemStatus,
  custodyStatus: ApiCustodyStatus
): ApiEditablePostCustodyStatus[] {
  if (itemType !== "found") {
    return [];
  }

  if (custodyStatus === "untracked") {
    return POST_RECORD_UNTRACKED_CUSTODY_STATUS_OPTIONS;
  }

  if (itemStatus === "claimed") {
    return POST_RECORD_CLAIMED_CUSTODY_STATUS_OPTIONS;
  }

  return [];
}

export function shouldShowPostRecordCustodyOptions(
  itemType: string | undefined,
  itemStatus: ApiItemStatus,
  custodyStatus: ApiCustodyStatus
): boolean {
  return getPostRecordCustodyStatusOptions(itemType, itemStatus, custodyStatus).length > 0;
}

export function shouldShowPostRecordItemStatusOptions(
  itemType: string | undefined,
  itemStatus: ApiItemStatus,
  custodyStatus: ApiCustodyStatus
): boolean {
  if (itemType !== "found") {
    return true;
  }

  if (custodyStatus === "untracked") {
    return true;
  }

  return itemStatus !== "claimed";
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

export function resolvePostRecordSelectedCustodyStatus(
  currentStatus: ApiCustodyStatus,
  selectedStatus: ApiEditablePostCustodyStatus | null
): ApiEditablePostCustodyStatus | null {
  if (selectedStatus) return selectedStatus;
  return isEditablePostCustodyStatus(currentStatus) ? currentStatus : null;
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

export function togglePostRecordCustodyStatusSelection(
  currentStatus: ApiEditablePostCustodyStatus | null,
  nextStatus: ApiEditablePostCustodyStatus
): ApiEditablePostCustodyStatus | null {
  return nextStatus === currentStatus ? null : nextStatus;
}

export function getPostRecordStatusChangeDecision(params: {
  currentItemStatus: ApiItemStatus;
  selectedPostStatus: ApiPostStatus | null;
  selectedItemStatus: ApiItemStatus | null;
  selectedCustodyStatus: ApiEditablePostCustodyStatus | null;
}): PostRecordStatusChangeDecision {
  if (!params.selectedPostStatus && !params.selectedItemStatus && !params.selectedCustodyStatus) {
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
