import { requestCreatePostAutofill } from "@/services/create-post-service";

export const AI_AUTOFILL_RATE_LIMIT_KEY = "ai_autofill_timestamps";
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function readTimestamps(): number[] {
  try {
    const raw = window.localStorage.getItem(AI_AUTOFILL_RATE_LIMIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "number") : [];
  } catch {
    return [];
  }
}

function writeTimestamps(timestamps: number[]): void {
  try {
    window.localStorage.setItem(AI_AUTOFILL_RATE_LIMIT_KEY, JSON.stringify(timestamps));
  } catch {
    // noop
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface AutofillResult {
  success: boolean;
  rateLimitExceeded?: boolean;
  skipped?: boolean;
  content?: {
    itemName?: string;
    itemDescription?: string;
    itemCategory?: string;
  };
  error?: string;
}

export interface AutofillOptions {
  imageFile: File;
  currentTitle: string;
  currentDesc: string;
  currentCategory: string | null;
}

export async function generateAndAutofillFields(options: AutofillOptions): Promise<AutofillResult> {
  const now = Date.now();
  const recent = readTimestamps().filter((timestamp) => now - timestamp <= RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { success: false, rateLimitExceeded: true };
  }

  recent.push(now);
  writeTimestamps(recent);

  const titleEmpty = !options.currentTitle.trim();
  const descriptionEmpty = !options.currentDesc.trim();
  const categoryEmpty = !options.currentCategory;

  if (!titleEmpty && !descriptionEmpty && !categoryEmpty) {
    return { success: true, skipped: true };
  }

  try {
    const dataUrl = await fileToDataUrl(options.imageFile);

    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("ai_timeout")), 15000);
    });

    const autofillPromise = requestCreatePostAutofill({
      image_data_url: dataUrl,
      current_title: titleEmpty ? "" : options.currentTitle.trim(),
      current_description: descriptionEmpty ? "" : options.currentDesc.trim(),
      current_category: categoryEmpty ? "" : options.currentCategory || "",
    });

    const result = await Promise.race([autofillPromise, timeoutPromise]);

    if (result.error === "rate_limit_exceeded") {
      return { success: false, rateLimitExceeded: true };
    }

    if (!result.success || !result.content) {
      return { success: false, error: result.error || "AI generation failed" };
    }

    const content: {
      itemName?: string;
      itemDescription?: string;
      itemCategory?: string;
    } = {};

    if (titleEmpty && result.content.itemName) {
      content.itemName = result.content.itemName;
    }
    if (descriptionEmpty && result.content.itemDescription) {
      content.itemDescription = result.content.itemDescription;
    }
    if (categoryEmpty && result.content.itemCategory) {
      content.itemCategory = result.content.itemCategory;
    }

    return { success: true, content };
  } catch (error) {
    if (error instanceof Error && error.message === "ai_timeout") {
      return { success: false, error: "ai_timeout" };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown AI error",
    };
  }
}
