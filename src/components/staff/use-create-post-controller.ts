"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { initializeDateTimeState, toISODate } from "@/lib/date-time-helpers";
import { generateAndAutofillFields } from "@/lib/ai-autofill";
import { isValidPostCategory } from "@/lib/post-categories";
import { createStaffPost } from "@/services/create-post-service";
import { formReducer, uiReducer, type ToastState } from "@/components/staff/create-post-view-state";

export function useCreatePostController() {
  const router = useRouter();
  const initialDateTime = useMemo(() => initializeDateTimeState(), []);
  const { user, isLoading: authLoading } = useCurrentUser();
  const [form, dispatchForm] = useReducer(formReducer, {
    title: "",
    description: "",
    date: initialDateTime.date,
    time: initialDateTime.time,
    meridian: initialDateTime.meridian,
    image: null,
    category: "",
    locationDetails: { level1: "", level2: "", level3: "" },
  });
  const [ui, dispatchUi] = useReducer(uiReducer, {
    isSubmitting: false,
    isAiGenerating: false,
    aiGeneratedContent: null,
    showAiConfirm: false,
    showSubmitConfirm: false,
    showDiscardConfirm: false,
    toast: null,
  });
  const aiAbortRef = useRef(false);
  const submitTimeoutRef = useRef<number | null>(null);

  const imagePreviewUrl = useMemo(() => (form.image ? URL.createObjectURL(form.image) : null), [form.image]);
  const hasUnsavedChanges =
    form.title.trim() !== "" ||
    form.description.trim() !== "" ||
    form.image !== null ||
    form.category !== "" ||
    form.locationDetails.level1.trim() !== "" ||
    form.locationDetails.level2.trim() !== "" ||
    form.locationDetails.level3.trim() !== "";

  useEffect(() => {
    if (!ui.toast) return;
    const timer = window.setTimeout(() => dispatchUi({ type: "set_toast", value: null }), 3200);
    return () => window.clearTimeout(timer);
  }, [ui.toast]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) window.clearTimeout(submitTimeoutRef.current);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || ui.isSubmitting) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, [hasUnsavedChanges, ui.isSubmitting]);

  const setToast = (toast: ToastState | null) => dispatchUi({ type: "set_toast", value: toast });

  const handleImageFile = async (file: File | null) => {
    dispatchForm({ type: "set_image", value: file });
    aiAbortRef.current = false;
    dispatchUi({ type: "set_ai_content", value: null });
    dispatchUi({ type: "set_modal", modal: "showAiConfirm", value: false });
    setToast(null);
    if (!file) return;

    dispatchUi({ type: "set_ai_generating", value: true });
    try {
      const result = await generateAndAutofillFields({
        imageFile: file,
        currentTitle: "",
        currentDesc: "",
        currentCategory: null,
      });

      if (aiAbortRef.current) return;
      if (result.rateLimitExceeded) {
        setToast({ tone: "danger", message: "Autogeneration is limited to 10 times per 5 minutes. Try again later." });
        return;
      }
      if (result.success && result.content) {
        dispatchUi({ type: "set_ai_content", value: result.content });
        dispatchUi({ type: "set_modal", modal: "showAiConfirm", value: true });
        return;
      }
      if (result.error === "ai_timeout") {
        setToast({ tone: "danger", message: "AI autofill took too long. Please fill in fields manually." });
        return;
      }
      setToast({ tone: "danger", message: "AI autofill failed. Please fill in fields manually." });
    } finally {
      dispatchUi({ type: "set_ai_generating", value: false });
    }
  };

  const validateFields = (): boolean => {
    if (
      form.title.trim() === "" ||
      form.description.trim() === "" ||
      !form.image ||
      form.category.trim() === "" ||
      form.locationDetails.level1.trim() === "" ||
      form.locationDetails.level2.trim() === "" ||
      form.locationDetails.level3.trim() === "" ||
      form.date.trim() === "" ||
      form.time.trim() === ""
    ) {
      setToast({ tone: "danger", message: "Please fill in all required fields." });
      return false;
    }
    if (!isValidPostCategory(form.category)) {
      setToast({ tone: "danger", message: "Please select a valid category." });
      return false;
    }
    if (!user?.user_id) {
      setToast({ tone: "danger", message: "User not authenticated." });
      return false;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setToast({ tone: "danger", message: "Failed to create new post - device not connected to the internet" });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (submitTimeoutRef.current) window.clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = window.setTimeout(async () => {
      if (ui.isSubmitting || ui.isAiGenerating) return;
      if (!validateFields()) return;

      dispatchUi({ type: "set_submitting", value: true });
      try {
        const result = await createStaffPost({
          userId: user!.user_id,
          itemName: form.title.trim(),
          itemDescription: form.description.trim(),
          category: form.category.trim(),
          lastSeenISO: toISODate(form.date, form.time, form.meridian),
          locationDetails: {
            level1: form.locationDetails.level1.trim(),
            level2: form.locationDetails.level2.trim(),
            level3: form.locationDetails.level3.trim(),
          },
          image: form.image!,
        });
        if (!result.post_id) throw new Error("Failed to create post");
        setToast({ tone: "success", message: "Post created successfully!" });
        window.setTimeout(() => router.push("/staff/post-records"), 800);
      } catch (error) {
        setToast({ tone: "danger", message: error instanceof Error ? error.message : "Failed to create post" });
      } finally {
        dispatchUi({ type: "set_submitting", value: false });
      }
    }, 300);
  };

  const handleApplyAiSuggestion = () => {
    if (!ui.aiGeneratedContent) return;
    if (ui.aiGeneratedContent.itemName) {
      dispatchForm({ type: "set_field", field: "title", value: ui.aiGeneratedContent.itemName.slice(0, 32) });
    }
    if (ui.aiGeneratedContent.itemDescription) {
      dispatchForm({ type: "set_field", field: "description", value: ui.aiGeneratedContent.itemDescription.slice(0, 150) });
    }
    if (ui.aiGeneratedContent.itemCategory && isValidPostCategory(ui.aiGeneratedContent.itemCategory)) {
      dispatchForm({ type: "set_field", field: "category", value: ui.aiGeneratedContent.itemCategory });
    }
    dispatchUi({ type: "set_ai_content", value: null });
    dispatchUi({ type: "set_modal", modal: "showAiConfirm", value: false });
  };

  const handleCancelAiGeneration = () => {
    aiAbortRef.current = true;
    dispatchUi({ type: "set_ai_generating", value: false });
    dispatchUi({ type: "set_ai_content", value: null });
    dispatchUi({ type: "set_modal", modal: "showAiConfirm", value: false });
  };

  return {
    router,
    user,
    authLoading,
    form,
    ui,
    imagePreviewUrl,
    hasUnsavedChanges,
    dispatchForm,
    dispatchUi,
    handleImageFile,
    handleSubmit,
    handleApplyAiSuggestion,
    handleCancelAiGeneration,
  };
}
