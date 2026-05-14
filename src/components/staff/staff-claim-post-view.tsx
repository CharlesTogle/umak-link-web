"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import { useProcessClaimMutation } from "@/hooks/mutations/claim-mutations";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLostItemLookup, usePostDetail } from "@/hooks/queries/post-queries";
import { useUserSearch } from "@/hooks/queries/user-queries";
import { logError } from "@/lib/error-utils";
import { normalizeValue } from "@/lib/format-utils";
import { CustomToast } from "@/components/ui/custom-toast";
import {
  ClaimModals,
  ClaimSidebar,
  ClaimToolbar,
  FoundItemPanel,
} from "@/components/staff/staff-claim-post-view-sections";
import {
  formatPhoneNumber,
  formReducer,
  normalizePhoneNumber,
  uiReducer,
} from "@/components/staff/staff-claim-post-view-state";
import type { UserSearchResult } from "@/types/user-search";

export function StaffClaimPostView({ postId }: { postId: string }) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const claimMutation = useProcessClaimMutation();
  const [formData, dispatchForm] = useReducer(formReducer, {
    contactNumber: "",
    lostItemId: "",
    claimedAt: new Date().toISOString().slice(0, 16),
  });
  const [ui, dispatchUi] = useReducer(uiReducer, {
    toast: null,
    searchQuery: "",
    selectedUser: null,
    showManualInput: false,
    manualName: "",
    manualEmail: "",
    showConfirmModal: false,
    showCancelModal: false,
  });

  const debouncedSearchQuery = useDebouncedValue(ui.searchQuery, 300);
  const debouncedLostItemId = useDebouncedValue(formData.lostItemId, 500);
  const postQuery = usePostDetail(postId);
  const userSearchQuery = useUserSearch(debouncedSearchQuery);
  const lostItemQuery = useLostItemLookup(debouncedLostItemId);
  const post = postQuery.data && normalizeValue(postQuery.data.item_type) === "found" ? postQuery.data : null;
  const lostItemPost = lostItemQuery.data ?? null;
  const searchResults = userSearchQuery.data ?? [];
  const isSearching = userSearchQuery.isFetching;
  const isLoadingLostItem = lostItemQuery.isFetching;
  const lostItemError = lostItemQuery.error instanceof Error ? lostItemQuery.error.message : null;
  const isSubmitting = claimMutation.isPending;
  const claimBlockedMessage = post
    ? normalizeValue(post.post_status) !== "accepted"
      ? "This found post must be accepted before it can be claimed."
      : normalizeValue(post.item_status) !== "unclaimed"
        ? "This found post is no longer available for claim."
        : normalizeValue(post.custody_status) !== "in_security_office"
          ? "This found post cannot be claimed until the item is received in the Security Office."
          : null
    : null;

  const hasUnsavedChanges = useMemo(
    () => ui.selectedUser !== null || formData.contactNumber !== "" || formData.lostItemId !== "",
    [formData.contactNumber, formData.lostItemId, ui.selectedUser]
  );

  const showToast = useCallback((message: string, tone: "success" | "danger") => {
    dispatchUi({ type: "set_toast", value: { message, tone } });
  }, []);

  useEffect(() => {
    if (!ui.toast) return;
    const timer = window.setTimeout(() => dispatchUi({ type: "set_toast", value: null }), 3000);
    return () => window.clearTimeout(timer);
  }, [ui.toast]);

  useEffect(() => {
    if (postQuery.error) showToast("Failed to load post", "danger");
  }, [postQuery.error, showToast]);

  const handleUserSelect = (user: UserSearchResult) => {
    dispatchUi({
      type: "set_selected_user",
      value: {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email,
        profile_picture_url: user.profile_picture_url ?? null,
      },
    });
    dispatchUi({ type: "set_search_query", value: "" });
    if (ui.showManualInput) dispatchUi({ type: "toggle_manual_input" });
  };

  const handleManualSubmit = () => {
    const emailPattern = /^[a-zA-Z0-9._-]+@umak\.edu\.ph$/;
    if (!ui.manualEmail.trim() || !emailPattern.test(ui.manualEmail)) {
      showToast("Please enter a valid UMak email (e.g., user@umak.edu.ph)", "danger");
      return;
    }
    if (!ui.manualName.trim()) {
      showToast("Please enter the user's name", "danger");
      return;
    }
    dispatchUi({
      type: "set_selected_user",
      value: {
        user_id: `manual-${Date.now()}`,
        user_name: ui.manualName.trim(),
        email: ui.manualEmail.trim(),
        profile_picture_url: null,
      },
    });
    dispatchUi({ type: "set_manual_name", value: "" });
    dispatchUi({ type: "set_manual_email", value: "" });
    if (ui.showManualInput) dispatchUi({ type: "toggle_manual_input" });
  };

  const handleSubmit = async () => {
    dispatchUi({ type: "set_modal", modal: "showConfirmModal", value: false });
    if (isSubmitting) return;
    if (!post || !ui.selectedUser) return showToast("Missing required information", "danger");

    const latestPostResult = await postQuery.refetch();
    const latestPost = latestPostResult.data;
    if (
      !latestPost ||
      normalizeValue(latestPost.item_type) !== "found" ||
      normalizeValue(latestPost.post_status) !== "accepted" ||
      normalizeValue(latestPost.item_status) !== "unclaimed" ||
      normalizeValue(latestPost.custody_status) !== "in_security_office"
    ) {
      showToast("This found post is not ready to be claimed.", "danger");
      return;
    }

    const normalized = normalizePhoneNumber(formData.contactNumber);
    if (!normalized) {
      return showToast("Please enter a valid Philippine mobile number (e.g., 09123456789, +639123456789)", "danger");
    }
    if (formData.lostItemId.trim() && !lostItemPost) {
      return showToast("Referenced lost item not found. Please verify the Item ID.", "danger");
    }

    if (!currentUser?.user_id) {
      showToast("Authentication required", "danger");
      return;
    }

    const claimedAt = formData.claimedAt ? new Date(formData.claimedAt) : null;
    if (!claimedAt || Number.isNaN(claimedAt.getTime())) {
      showToast("Please enter a valid claimed date and time", "danger");
      return;
    }

    try {
      await claimMutation.mutateAsync({
        found_post_id: Number(postId),
        missing_post_id: lostItemPost ? Number(lostItemPost.post_id) : null,
        claim_details: {
          claimer_name: ui.selectedUser.user_name,
          claimer_school_email: ui.selectedUser.email,
          claimer_contact_num: formatPhoneNumber(normalized),
          claimed_at: claimedAt.toISOString(),
          poster_name: post.is_anonymous ? "Anonymous" : post.poster_name ?? "Unknown User",
          staff_id: currentUser.user_id,
          staff_name: currentUser.user_name ?? "Staff User",
        },
      });

      showToast("Item claimed successfully", "success");
      window.setTimeout(() => router.push("/staff/post-records"), 1500);
    } catch (err) {
      logError("Claim submission error:", err);
      showToast(err instanceof Error ? err.message : "Failed to claim item. Please try again.", "danger");
    }
  };

  if (postQuery.isLoading) {
    return <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" /><div className="mt-4 h-64 animate-pulse rounded-2xl bg-slate-100" /></div></section>;
  }

  if (!post) {
    return <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Post not found or cannot be claimed</h1></div></section>;
  }

  if (claimBlockedMessage) {
    return <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Post not ready for claim</h1><p className="mt-2 text-sm text-slate-600">{claimBlockedMessage}</p></div></section>;
  }

  const isFormValid =
    ui.selectedUser !== null &&
    formData.contactNumber.trim() !== "" &&
    formData.claimedAt.trim() !== "" &&
    normalizePhoneNumber(formData.contactNumber) !== null &&
    (!formData.lostItemId.trim() || lostItemPost !== null);

  return (
    <PhotoProvider>
      <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-1">
        <ClaimToolbar
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          onBack={() => {
            if (hasUnsavedChanges) dispatchUi({ type: "set_modal", modal: "showCancelModal", value: true });
            else router.push("/staff/post-records");
          }}
          onSubmit={() => dispatchUi({ type: "set_modal", modal: "showConfirmModal", value: true })}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-12">
          <FoundItemPanel post={post} lostItemPost={lostItemPost} />
          <ClaimSidebar
            selectedUser={ui.selectedUser}
            searchQuery={ui.searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            showManualInput={ui.showManualInput}
            manualName={ui.manualName}
            manualEmail={ui.manualEmail}
            formData={formData}
            isLoadingLostItem={isLoadingLostItem}
            lostItemError={lostItemError}
            onToggleManualInput={() => dispatchUi({ type: "toggle_manual_input" })}
            onSearchQueryChange={(value) => dispatchUi({ type: "set_search_query", value })}
            onUserSelect={handleUserSelect}
            onClearUser={() => dispatchUi({ type: "set_selected_user", value: null })}
            onManualNameChange={(value) => dispatchUi({ type: "set_manual_name", value })}
            onManualEmailChange={(value) => dispatchUi({ type: "set_manual_email", value })}
            onSubmitManual={handleManualSubmit}
            onFieldChange={(key, value) => dispatchForm({ type: "set_field", key, value })}
          />
        </div>

        <ClaimModals
          showConfirmModal={ui.showConfirmModal}
          showCancelModal={ui.showCancelModal}
          selectedUserName={ui.selectedUser?.user_name}
          isSubmitting={isSubmitting}
          onCloseConfirm={() => dispatchUi({ type: "set_modal", modal: "showConfirmModal", value: false })}
          onConfirm={() => void handleSubmit()}
          onCloseCancel={() => dispatchUi({ type: "set_modal", modal: "showCancelModal", value: false })}
          onDiscard={() => router.push("/staff/post-records")}
        />

        {ui.toast ? <CustomToast message={ui.toast.message} tone={ui.toast.tone} mode="floating" /> : null}
      </section>
    </PhotoProvider>
  );
}
