import type { ApiItemStatus, ApiPostStatus } from "@/types/post-record-api";
import type { ToastTone } from "@/types/ui";

export interface PostRecordDetailUiState {
  isSubmitting: boolean;
  toast: { message: string; tone: ToastTone } | null;
  showStatusModal: boolean;
  showRejectModal: boolean;
  showUnclaimModal: boolean;
  showNotifyModal: boolean;
  selectedStatus: ApiPostStatus | null;
  selectedItemStatus: ApiItemStatus | null;
}

export type PostRecordDetailUiAction =
  | { type: "set_submitting"; value: boolean }
  | { type: "set_toast"; value: PostRecordDetailUiState["toast"] }
  | { type: "set_modal"; modal: "showStatusModal" | "showRejectModal" | "showUnclaimModal" | "showNotifyModal"; value: boolean }
  | { type: "set_selected_status"; value: ApiPostStatus | null }
  | { type: "set_selected_item_status"; value: ApiItemStatus | null }
  | { type: "clear_selection" };

export function postRecordDetailUiReducer(
  state: PostRecordDetailUiState,
  action: PostRecordDetailUiAction
): PostRecordDetailUiState {
  switch (action.type) {
    case "set_submitting":
      return { ...state, isSubmitting: action.value };
    case "set_toast":
      return { ...state, toast: action.value };
    case "set_modal":
      return { ...state, [action.modal]: action.value };
    case "set_selected_status":
      return { ...state, selectedStatus: action.value };
    case "set_selected_item_status":
      return { ...state, selectedItemStatus: action.value };
    case "clear_selection":
      return { ...state, selectedStatus: null, selectedItemStatus: null };
  }
}
