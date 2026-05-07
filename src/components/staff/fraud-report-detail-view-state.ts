import type { ToastTone } from "@/types/ui";

export interface FraudReportDetailUiState {
  isProcessing: boolean;
  toast: { message: string; tone: ToastTone } | null;
  showAcceptModal: boolean;
  showRejectModal: boolean;
  showCloseChoiceModal: boolean;
  showDeleteModal: boolean;
  closeReportConfirmed: boolean;
}

export type FraudReportDetailUiAction =
  | { type: "set_processing"; value: boolean }
  | { type: "set_toast"; value: FraudReportDetailUiState["toast"] }
  | {
      type: "set_modal";
      modal: "showAcceptModal" | "showRejectModal" | "showCloseChoiceModal" | "showDeleteModal";
      value: boolean;
    }
  | { type: "set_close_report_confirmed"; value: boolean };

export function fraudReportDetailUiReducer(
  state: FraudReportDetailUiState,
  action: FraudReportDetailUiAction
): FraudReportDetailUiState {
  switch (action.type) {
    case "set_processing":
      return { ...state, isProcessing: action.value };
    case "set_toast":
      return { ...state, toast: action.value };
    case "set_modal":
      return { ...state, [action.modal]: action.value };
    case "set_close_report_confirmed":
      return { ...state, closeReportConfirmed: action.value };
    default:
      return state;
  }
}
