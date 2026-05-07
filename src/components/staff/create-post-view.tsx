"use client";

import { CustomToast } from "@/components/ui/custom-toast";
import {
  CreatePostFormSection,
  CreatePostImageSection,
  CreatePostSidebar,
} from "@/components/staff/create-post-view-sections";
import {
  ActionModal,
  AiGeneratedContentModal,
  AiGeneratingOverlay,
} from "@/components/staff/create-post-view-modals";
import {
  formatDateForInput,
  formReducer,
  parse24HourTime,
  parseInputDate,
  to24HourTime,
} from "@/components/staff/create-post-view-state";
import { useCreatePostController } from "@/components/staff/use-create-post-controller";

export function CreatePostView() {
  const {
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
  } = useCreatePostController();

  if (authLoading) {
    return <section className="flex h-full items-center justify-center"><p className="text-sm text-slate-500">Loading account...</p></section>;
  }

  if (user && !["Staff", "Admin"].includes(user.user_type)) {
    return <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Unauthorized account.</section>;
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Create Staff Post</h1>
          <p className="mt-1 text-sm text-slate-600">Staff posts are submitted as found items and are published under staff workflows.</p>
        </div>

        {ui.toast ? <CustomToast message={ui.toast.message} tone={ui.toast.tone} /> : null}

        <CreatePostImageSection image={form.image} imagePreviewUrl={imagePreviewUrl} onChangeImage={handleImageFile} />
        <CreatePostFormSection
          title={form.title}
          description={form.description}
          category={form.category}
          date={form.date}
          time={form.time}
          meridian={form.meridian}
          locationDetails={form.locationDetails}
          isAiGenerating={ui.isAiGenerating}
          formatDateForInput={formatDateForInput}
          parseInputDate={parseInputDate}
          to24HourTime={to24HourTime}
          parse24HourTime={parse24HourTime}
          onTitleChange={(value) => dispatchForm({ type: "set_field", field: "title", value })}
          onDescriptionChange={(value) => dispatchForm({ type: "set_field", field: "description", value })}
          onCategoryChange={(value) => dispatchForm({ type: "set_field", field: "category", value })}
          onDateChange={(value) => dispatchForm({ type: "set_date", value })}
          onTimeChange={(time, meridian) => dispatchForm({ type: "set_time", time, meridian })}
          onMeridianChange={(value) => dispatchForm({ type: "set_meridian", value })}
          onLocationChange={(key, value) => dispatchForm({ type: "set_location", key, value })}
        />
      </div>

      <CreatePostSidebar
        isSubmitting={ui.isSubmitting}
        isAiGenerating={ui.isAiGenerating}
        onDiscard={() => {
          if (!hasUnsavedChanges) {
            router.push("/staff/post-records");
            return;
          }
          dispatchUi({ type: "set_modal", modal: "showDiscardConfirm", value: true });
        }}
        onSubmit={() => dispatchUi({ type: "set_modal", modal: "showSubmitConfirm", value: true })}
      />

      <ActionModal
        isOpen={ui.showSubmitConfirm}
        title="Submit report?"
        description="Once submitted, your report will be posted immediately."
        confirmLabel="Submit"
        cancelLabel="Keep editing"
        onCancel={() => dispatchUi({ type: "set_modal", modal: "showSubmitConfirm", value: false })}
        onConfirm={() => {
          dispatchUi({ type: "set_modal", modal: "showSubmitConfirm", value: false });
          handleSubmit();
        }}
      />
      <ActionModal
        isOpen={ui.showDiscardConfirm}
        title="Discard post?"
        description="You have unsaved changes. Are you sure you want to discard this post?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        confirmTone="danger"
        onCancel={() => dispatchUi({ type: "set_modal", modal: "showDiscardConfirm", value: false })}
        onConfirm={() => {
          dispatchUi({ type: "set_modal", modal: "showDiscardConfirm", value: false });
          router.push("/staff/post-records");
        }}
      />
      <AiGeneratingOverlay isOpen={ui.isAiGenerating} onCancel={handleCancelAiGeneration} />
      <AiGeneratedContentModal
        content={ui.aiGeneratedContent}
        isOpen={ui.showAiConfirm}
        onCancel={() => {
          dispatchUi({ type: "set_modal", modal: "showAiConfirm", value: false });
          dispatchUi({ type: "set_ai_content", value: null });
        }}
        onConfirm={handleApplyAiSuggestion}
      />
    </section>
  );
}
