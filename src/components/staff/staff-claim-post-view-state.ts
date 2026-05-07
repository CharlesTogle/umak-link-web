export interface SelectedUser {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url?: string | null;
}

export interface ClaimFormData {
  contactNumber: string;
  lostItemId: string;
  claimedAt: string;
}

export interface ClaimUiState {
  toast: { message: string; tone: "success" | "danger" } | null;
  searchQuery: string;
  selectedUser: SelectedUser | null;
  showManualInput: boolean;
  manualName: string;
  manualEmail: string;
  showConfirmModal: boolean;
  showCancelModal: boolean;
}

export type ClaimFormAction = { type: "set_field"; key: keyof ClaimFormData; value: string };
export type ClaimUiAction =
  | { type: "set_toast"; value: ClaimUiState["toast"] }
  | { type: "set_search_query"; value: string }
  | { type: "set_selected_user"; value: SelectedUser | null }
  | { type: "toggle_manual_input" }
  | { type: "set_manual_name"; value: string }
  | { type: "set_manual_email"; value: string }
  | { type: "set_modal"; modal: "showConfirmModal" | "showCancelModal"; value: boolean };

export function normalizePhoneNumber(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, "");
  if (/^63\d{10}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  if (/^0\d{10}$/.test(digits)) return digits;
  return null;
}

export function formatPhoneNumber(local: string): string {
  return local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}

export function formReducer(state: ClaimFormData, action: ClaimFormAction): ClaimFormData {
  return { ...state, [action.key]: action.value };
}

export function uiReducer(state: ClaimUiState, action: ClaimUiAction): ClaimUiState {
  switch (action.type) {
    case "set_toast":
      return { ...state, toast: action.value };
    case "set_search_query":
      return { ...state, searchQuery: action.value };
    case "set_selected_user":
      return { ...state, selectedUser: action.value };
    case "toggle_manual_input":
      return { ...state, showManualInput: !state.showManualInput };
    case "set_manual_name":
      return { ...state, manualName: action.value };
    case "set_manual_email":
      return { ...state, manualEmail: action.value };
    case "set_modal":
      return { ...state, [action.modal]: action.value };
  }
}
