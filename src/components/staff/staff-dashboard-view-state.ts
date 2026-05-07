import type { CustomToastTone } from "@/components/ui/custom-toast";
import type { CompactPost } from "@/types/compact-post";

export interface DashboardToast {
  id: string;
  message: string;
  tone: CustomToastTone;
}

export type DashboardDecisionType = "accept" | "reject" | "notify";

export interface StaffDashboardUiState {
  toasts: DashboardToast[];
  pendingRejectPost: CompactPost | null;
  selectedRejectReason: string;
  isSubmittingDecision: boolean;
  pendingDecisionPostId: string | null;
  pendingDecisionType: DashboardDecisionType | null;
}

export type StaffDashboardUiAction =
  | { type: "add_toast"; value: DashboardToast }
  | { type: "remove_toast"; id: string }
  | { type: "open_reject_modal"; post: CompactPost }
  | { type: "set_reject_reason"; value: string }
  | { type: "close_reject_modal" }
  | { type: "start_decision"; postId: string; decisionType: DashboardDecisionType }
  | { type: "finish_decision" };

export const initialStaffDashboardUiState: StaffDashboardUiState = {
  toasts: [],
  pendingRejectPost: null,
  selectedRejectReason: "",
  isSubmittingDecision: false,
  pendingDecisionPostId: null,
  pendingDecisionType: null,
};

export function staffDashboardUiReducer(
  state: StaffDashboardUiState,
  action: StaffDashboardUiAction
): StaffDashboardUiState {
  switch (action.type) {
    case "add_toast":
      return { ...state, toasts: [...state.toasts, action.value] };
    case "remove_toast":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    case "open_reject_modal":
      return {
        ...state,
        pendingRejectPost: action.post,
        selectedRejectReason: "",
      };
    case "set_reject_reason":
      return { ...state, selectedRejectReason: action.value };
    case "close_reject_modal":
      return {
        ...state,
        pendingRejectPost: null,
        selectedRejectReason: "",
      };
    case "start_decision":
      return {
        ...state,
        isSubmittingDecision: true,
        pendingDecisionPostId: action.postId,
        pendingDecisionType: action.decisionType,
      };
    case "finish_decision":
      return {
        ...state,
        isSubmittingDecision: false,
        pendingDecisionPostId: null,
        pendingDecisionType: null,
      };
  }
}
