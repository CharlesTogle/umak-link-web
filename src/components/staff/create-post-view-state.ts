import type { Meridian } from "@/lib/date-time-helpers";

export interface LocationDetails {
  level1: string;
  level2: string;
  level3: string;
}

export interface ToastState {
  tone: "success" | "danger";
  message: string;
}

export interface AiGeneratedContent {
  itemName?: string;
  itemDescription?: string;
  itemCategory?: string;
}

export interface CreatePostFormState {
  title: string;
  description: string;
  date: string;
  time: string;
  meridian: Meridian;
  image: File | null;
  category: string;
  locationDetails: LocationDetails;
}

export interface CreatePostUiState {
  isSubmitting: boolean;
  isAiGenerating: boolean;
  aiGeneratedContent: AiGeneratedContent | null;
  showAiConfirm: boolean;
  showSubmitConfirm: boolean;
  showDiscardConfirm: boolean;
  toast: ToastState | null;
}

export type FormAction =
  | { type: "set_field"; field: "title" | "description" | "category"; value: string }
  | { type: "set_date"; value: string }
  | { type: "set_time"; time: string; meridian: Meridian }
  | { type: "set_meridian"; value: Meridian }
  | { type: "set_image"; value: File | null }
  | { type: "set_location"; key: keyof LocationDetails; value: string };

export type UiAction =
  | { type: "set_submitting"; value: boolean }
  | { type: "set_ai_generating"; value: boolean }
  | { type: "set_ai_content"; value: AiGeneratedContent | null }
  | { type: "set_modal"; modal: "showAiConfirm" | "showSubmitConfirm" | "showDiscardConfirm"; value: boolean }
  | { type: "set_toast"; value: ToastState | null };

export function formatDateForInput(value: string): string {
  const [month = "01", day = "01", year = "1970"] = value.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function parseInputDate(value: string): string {
  const [year = "1970", month = "01", day = "01"] = value.split("-");
  return `${month}/${day}/${year}`;
}

export function to24HourTime(time: string, meridian: Meridian): string {
  const [rawHours = 0, minutes = 0] = time.split(":").map((part) => Number(part));
  let hours = rawHours;
  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parse24HourTime(value: string): { time: string; meridian: Meridian } {
  const [rawHour = 0, rawMinute = 0] = value.split(":").map((part) => Number(part));
  const meridian: Meridian = rawHour >= 12 ? "PM" : "AM";
  const hour12 = rawHour % 12 || 12;
  return { time: `${hour12}:${String(rawMinute).padStart(2, "0")}`, meridian };
}

export function formReducer(state: CreatePostFormState, action: FormAction): CreatePostFormState {
  switch (action.type) {
    case "set_field":
      return { ...state, [action.field]: action.value };
    case "set_date":
      return { ...state, date: action.value };
    case "set_time":
      return { ...state, time: action.time, meridian: action.meridian };
    case "set_meridian":
      return { ...state, meridian: action.value };
    case "set_image":
      return { ...state, image: action.value };
    case "set_location":
      return { ...state, locationDetails: { ...state.locationDetails, [action.key]: action.value } };
  }
}

export function uiReducer(state: CreatePostUiState, action: UiAction): CreatePostUiState {
  switch (action.type) {
    case "set_submitting":
      return { ...state, isSubmitting: action.value };
    case "set_ai_generating":
      return { ...state, isAiGenerating: action.value };
    case "set_ai_content":
      return { ...state, aiGeneratedContent: action.value };
    case "set_modal":
      return { ...state, [action.modal]: action.value };
    case "set_toast":
      return { ...state, toast: action.value };
  }
}
