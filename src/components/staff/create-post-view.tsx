"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Info, Loader2, Sparkles, Upload, X } from "lucide-react";
import { generateAndAutofillFields } from "@/lib/ai-autofill";
import { CustomToast } from "@/components/ui/custom-toast";
import {
  initializeDateTimeState,
  Meridian,
  toISODate,
} from "@/lib/date-time-helpers";
import { POST_CATEGORIES, isValidPostCategory } from "@/lib/post-categories";
import { createStaffPost } from "@/services/create-post-service";
import { useAuthStore } from "@/stores/auth-store";

interface LocationDetails {
  level1: string;
  level2: string;
  level3: string;
}

interface ToastState {
  tone: "success" | "danger";
  message: string;
}

function formatDateForInput(value: string): string {
  const [month = "01", day = "01", year = "1970"] = value.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseInputDate(value: string): string {
  const [year = "1970", month = "01", day = "01"] = value.split("-");
  return `${month}/${day}/${year}`;
}

function to24HourTime(time: string, meridian: Meridian): string {
  const [rawHours = 0, minutes = 0] = time.split(":").map((part) => Number(part));
  let hours = rawHours;
  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parse24HourTime(value: string): { time: string; meridian: Meridian } {
  const [rawHour = 0, rawMinute = 0] = value.split(":").map((part) => Number(part));
  const meridian: Meridian = rawHour >= 12 ? "PM" : "AM";
  const hour12 = rawHour % 12 || 12;
  return {
    time: `${hour12}:${String(rawMinute).padStart(2, "0")}`,
    meridian,
  };
}

function ActionModal(props: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmTone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{props.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{props.description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            {props.cancelLabel}
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className={`rounded-full px-4 py-2 text-sm text-white ${
              props.confirmTone === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#1D2981] hover:bg-[#16206b]"
            }`}
          >
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatePostView() {
  const router = useRouter();
  const initialDateTime = useMemo(() => initializeDateTimeState(), []);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initialDateTime.date);
  const [time, setTime] = useState(initialDateTime.time);
  const [meridian, setMeridian] = useState<Meridian>(initialDateTime.meridian);
  const [image, setImage] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({
    level1: "",
    level2: "",
    level3: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const aiAbortRef = useRef(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{
    itemName?: string;
    itemDescription?: string;
    itemCategory?: string;
  } | null>(null);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const submitTimeoutRef = useRef<number | null>(null);

  const imagePreviewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
      }
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const hasUnsavedChanges =
    title.trim() !== "" ||
    description.trim() !== "" ||
    image !== null ||
    category !== "" ||
    locationDetails.level1.trim() !== "" ||
    locationDetails.level2.trim() !== "" ||
    locationDetails.level3.trim() !== "";

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || isSubmitting) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, [hasUnsavedChanges, isSubmitting]);

  const handleImageFile = async (file: File | null) => {
    setImage(file);
    aiAbortRef.current = false;
    setAiGeneratedContent(null);
    setShowAiConfirm(false);
    setToast(null);

    if (!file) return;

    setIsAiGenerating(true);

    try {
      const result = await generateAndAutofillFields({
        imageFile: file,
        currentTitle: "",
        currentDesc: "",
        currentCategory: null,
      });

      if (aiAbortRef.current) return;

      if (result.rateLimitExceeded) {
        setToast({
          tone: "danger",
          message: "Autogeneration is limited to 10 times per 5 minutes. Try again later.",
        });
        return;
      }

      if (result.success && result.content) {
        setAiGeneratedContent(result.content);
        setShowAiConfirm(true);
        return;
      }

      if (result.error === "ai_timeout") {
        setToast({
          tone: "danger",
          message: "AI autofill took too long. Please fill in fields manually.",
        });
        return;
      }

      setToast({
        tone: "danger",
        message: "AI autofill failed. Please fill in fields manually.",
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    await handleImageFile(file);
    event.target.value = "";
  };

  const validateFields = (): boolean => {
    if (
      title.trim() === "" ||
      description.trim() === "" ||
      !image ||
      category.trim() === "" ||
      locationDetails.level1.trim() === "" ||
      locationDetails.level2.trim() === "" ||
      locationDetails.level3.trim() === "" ||
      date.trim() === "" ||
      time.trim() === ""
    ) {
      setToast({ tone: "danger", message: "Please fill in all required fields." });
      return false;
    }

    if (!isValidPostCategory(category)) {
      setToast({ tone: "danger", message: "Please select a valid category." });
      return false;
    }

    if (!user?.user_id) {
      setToast({ tone: "danger", message: "User not authenticated." });
      return false;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setToast({
        tone: "danger",
        message: "Failed to create new post - device not connected to the internet",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
    }

    submitTimeoutRef.current = window.setTimeout(async () => {
      if (isSubmitting || isAiGenerating) return;
      if (!validateFields()) return;

      setIsSubmitting(true);

      try {
        const result = await createStaffPost({
          userId: user!.user_id,
          itemName: title.trim(),
          itemDescription: description.trim(),
          category: category.trim(),
          lastSeenISO: toISODate(date, time, meridian),
          locationDetails: {
            level1: locationDetails.level1.trim(),
            level2: locationDetails.level2.trim(),
            level3: locationDetails.level3.trim(),
          },
          image: image!,
        });

        if (!result.post_id) {
          throw new Error("Failed to create post");
        }

        setToast({ tone: "success", message: "Post created successfully!" });
        window.setTimeout(() => {
          router.push("/staff/post-records");
        }, 800);
      } catch (error) {
        setToast({
          tone: "danger",
          message: error instanceof Error ? error.message : "Failed to create post",
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 300);
  };

  const handleApplyAiSuggestion = () => {
    if (!aiGeneratedContent) return;

    if (aiGeneratedContent.itemName) {
      setTitle(aiGeneratedContent.itemName.slice(0, 32));
    }
    if (aiGeneratedContent.itemDescription) {
      setDescription(aiGeneratedContent.itemDescription.slice(0, 150));
    }
    if (aiGeneratedContent.itemCategory && isValidPostCategory(aiGeneratedContent.itemCategory)) {
      setCategory(aiGeneratedContent.itemCategory);
    }

    setAiGeneratedContent(null);
    setShowAiConfirm(false);
  };

  const handleCancelAiGeneration = () => {
    aiAbortRef.current = true;
    setIsAiGenerating(false);
    setAiGeneratedContent(null);
    setShowAiConfirm(false);
  };

  const handleDiscard = () => {
    if (!hasUnsavedChanges) {
      router.push("/staff/post-records");
      return;
    }

    setShowDiscardConfirm(true);
  };

  if (authStatus === "loading") {
    return (
      <section className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading account...</p>
      </section>
    );
  }

  if (user && !["Staff", "Admin"].includes(user.user_type)) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Unauthorized account.
      </section>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Create Staff Post</h1>
          <p className="mt-1 text-sm text-slate-600">
            Staff posts are submitted as found items and are published under staff workflows.
          </p>
        </div>

        {toast ? <CustomToast message={toast.message} tone={toast.tone} /> : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#1D2981]">Item Image</p>
            {image ? (
              <button
                type="button"
                onClick={() => void handleImageFile(null)}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                <X className="size-3.5" />
                Remove
              </button>
            ) : null}
          </div>

          <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
            {imagePreviewUrl ? (
              <div className="space-y-3">
                <div className="relative h-64 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <Image src={imagePreviewUrl} alt="Item preview" fill className="object-contain" />
                </div>
                <p className="truncate text-xs text-slate-500">{image?.name}</p>
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center gap-2 text-center text-slate-500">
                <Upload className="size-8 text-slate-400" />
                <p className="text-sm font-medium">Upload item photo</p>
                <p className="text-xs">The image will be compressed to WebP (1600px max edge) before upload.</p>
              </div>
            )}

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm text-white hover:bg-[#16206b]">
              <Upload className="size-4" />
              {image ? "Replace image" : "Choose image"}
              <input type="file" accept="image/*" onChange={handleImageInputChange} className="hidden" />
            </label>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700">
            <Info className="mt-0.5 size-4 text-sky-700" />
            <p>
              Uploading an image can trigger Gemini suggestions for item title, description, and category.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Item Name/Title *</label>
            <input
              type="text"
              value={title}
              maxLength={32}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isAiGenerating}
              placeholder="Max 32 characters"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Description *</label>
            <textarea
              value={description}
              maxLength={150}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isAiGenerating}
              placeholder="Provide additional details about the item. Max 150 characters."
              className="h-28 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Category *</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={isAiGenerating}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
            >
              <option value="">Select category</option>
              {POST_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Last Seen Date *</label>
              <input
                type="date"
                value={formatDateForInput(date)}
                onChange={(event) => setDate(parseInputDate(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Time *</label>
              <input
                type="time"
                value={to24HourTime(time, meridian)}
                onChange={(event) => {
                  const parsed = parse24HourTime(event.target.value);
                  setTime(parsed.time);
                  setMeridian(parsed.meridian);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Meridian *</label>
              <select
                value={meridian}
                onChange={(event) => setMeridian(event.target.value as Meridian)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Building/Area *</label>
              <input
                type="text"
                value={locationDetails.level1}
                onChange={(event) =>
                  setLocationDetails((prev) => ({
                    ...prev,
                    level1: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Floor/Side *</label>
              <input
                type="text"
                value={locationDetails.level2}
                onChange={(event) =>
                  setLocationDetails((prev) => ({
                    ...prev,
                    level2: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Room/Place *</label>
              <input
                type="text"
                value={locationDetails.level3}
                onChange={(event) =>
                  setLocationDetails((prev) => ({
                    ...prev,
                    level3: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1D2981]"
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#1D2981]">Submission Rules</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Please fill out all required fields before submitting.</li>
            <li>Staff posts are automatically marked as found items.</li>
            <li>Images will be automatically converted to WebP format for faster loading.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#1D2981]">Actions</p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting || isAiGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm text-white hover:bg-[#16206b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit Post
            </button>
          </div>
        </div>
      </aside>

      <ActionModal
        isOpen={showSubmitConfirm}
        title="Submit report?"
        description="Once submitted, your report will be posted immediately."
        confirmLabel="Submit"
        cancelLabel="Keep editing"
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmit();
        }}
      />

      <ActionModal
        isOpen={showDiscardConfirm}
        title="Discard post?"
        description="You have unsaved changes. Are you sure you want to discard this post?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        confirmTone="danger"
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          router.push("/staff/post-records");
        }}
      />

      {isAiGenerating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#1D2981]/10 text-[#1D2981]">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-3 text-base font-semibold text-slate-900">Generating suggestions...</p>
            <p className="mt-1 text-sm text-slate-600">This may take a few seconds.</p>
            <button
              type="button"
              onClick={handleCancelAiGeneration}
              className="mt-4 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {showAiConfirm && aiGeneratedContent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-[#1D2981] px-5 py-3 text-white">
              <p className="text-base font-semibold">Generated Content</p>
            </div>
            <div className="space-y-4 p-5">
              {aiGeneratedContent.itemName ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item Name</p>
                  <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {aiGeneratedContent.itemName}
                  </p>
                </div>
              ) : null}
              {aiGeneratedContent.itemDescription ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
                  <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {aiGeneratedContent.itemDescription}
                  </p>
                </div>
              ) : null}
              {aiGeneratedContent.itemCategory ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
                  <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {aiGeneratedContent.itemCategory}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowAiConfirm(false);
                  setAiGeneratedContent(null);
                }}
                className="flex-1 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAiSuggestion}
                className="flex-1 border-l border-slate-200 px-4 py-3 text-sm font-medium text-[#1D2981] hover:bg-[#1D2981]/5"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
