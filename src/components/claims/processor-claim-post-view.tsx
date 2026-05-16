"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import { useProcessClaimMutation } from "@/hooks/mutations/claim-mutations";
import { useScanClaimVerificationMutation } from "@/hooks/mutations/claim-verification-mutations";
import { useClaimQrScanner } from "@/hooks/use-claim-qr-scanner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useClaimVerificationSessionStatus,
  useProcessorClaimVerificationSession,
} from "@/hooks/queries/claim-verification-queries";
import { useLostItemLookup, usePostDetail } from "@/hooks/queries/post-queries";
import { useUserSearch } from "@/hooks/queries/user-queries";
import { normalizeClaimCodeInput } from "@/lib/claim-code";
import { logError } from "@/lib/error-utils";
import { normalizeValue } from "@/lib/format-utils";
import { resolveUserByClaimCode } from "@/services/users-service";
import { CustomToast } from "@/components/ui/custom-toast";
import {
  ClaimModals,
  ClaimSidebar,
  ClaimToolbar,
  ClaimVerificationPanel,
  FoundItemPanel,
} from "@/components/staff/staff-claim-post-view-sections";
import {
  formatPhoneNumber,
  formReducer,
  normalizePhoneNumber,
  uiReducer,
} from "@/components/staff/staff-claim-post-view-state";
import type { ClaimQrScanPayload } from "@/types/claim-verification";
import type { ProcessClaimRequest } from "@/types/claims";
import type { UserSearchResult } from "@/types/user-search";

type ProcessorClaimMode = "staff" | "guard";

interface ProcessorClaimPostViewProps {
  mode: ProcessorClaimMode;
  postId: string;
}

function mapStaffClaimQrToSelectedUser(
  payload: Extract<ClaimQrScanPayload, { kind: "staff_claim_user_identity" }>
): UserSearchResult {
  return {
    user_id: payload.userId,
    user_name: payload.userName,
    email: payload.email,
    profile_picture_url: payload.profilePictureUrl,
  };
}

function mapResolvedClaimUserToSelectedUser(user: UserSearchResult): UserSearchResult {
  return {
    user_id: user.user_id,
    user_name: user.user_name?.trim() || user.email?.trim() || "Unknown User",
    email: user.email?.trim() || "",
    profile_picture_url: user.profile_picture_url ?? null,
  };
}

function getClaimBlockedMessage(
  mode: ProcessorClaimMode,
  post: {
    post_status: string;
    item_status: string;
    custody_status?: string | null;
  } | null
): string | null {
  if (!post) return null;

  if (normalizeValue(post.post_status) !== "accepted") {
    return "This found post must be accepted before it can be claimed.";
  }

  if (normalizeValue(post.item_status) !== "unclaimed") {
    return "This found post is no longer available for claim.";
  }

  if (mode === "guard") {
    return normalizeValue(post.custody_status) !== "with_guard"
      ? "This found post cannot be claimed until the guard still has custody of the item."
      : null;
  }

  return normalizeValue(post.custody_status) !== "in_security_office"
    ? "This found post cannot be claimed until the item is received in the Security Office."
    : null;
}

export function ProcessorClaimPostView({
  mode,
  postId,
}: ProcessorClaimPostViewProps) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const claimMutation = useProcessClaimMutation();
  const redirectTimerRef = useRef<number | null>(null);
  const [isResolvingClaimCode, setIsResolvingClaimCode] = useState(false);
  const [isRedirectingAfterClaim, setIsRedirectingAfterClaim] = useState(false);
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
    manualClaimCode: "",
    manualQrSessionId: "",
    manualQrSessionToken: "",
    showConfirmModal: false,
    showCancelModal: false,
  });

  const isGuardMode = mode === "guard";
  const backPath = isGuardMode ? "/guard/active-reviews" : "/staff/post-records";
  const debouncedSearchQuery = useDebouncedValue(ui.searchQuery, 300);
  const debouncedLostItemId = useDebouncedValue(formData.lostItemId, 500);
  const postQuery = usePostDetail(postId);
  const userSearchQuery = useUserSearch(isGuardMode ? "" : debouncedSearchQuery);
  const lostItemQuery = useLostItemLookup(isGuardMode ? "" : debouncedLostItemId);
  const post =
    postQuery.data && normalizeValue(postQuery.data.item_type) === "found"
      ? postQuery.data
      : null;
  const claimBlockedMessage = isRedirectingAfterClaim
    ? null
    : getClaimBlockedMessage(mode, post);
  const shouldUseClaimVerificationSession =
    isGuardMode && Boolean(post) && !claimBlockedMessage;

  const processorSessionQuery = useProcessorClaimVerificationSession(
    postId,
    mode,
    shouldUseClaimVerificationSession
  );
  const sessionStatusQuery = useClaimVerificationSessionStatus(
    processorSessionQuery.data?.claim_verification_session_id ?? null,
    isGuardMode && Boolean(processorSessionQuery.data?.claim_verification_session_id)
  );
  const scanMutation = useScanClaimVerificationMutation();

  const showToast = useCallback((message: string, tone: "success" | "danger") => {
    dispatchUi({ type: "set_toast", value: { message, tone } });
  }, []);

  const handleVerifyClaimQr = useCallback(
    async (payload: ClaimQrScanPayload) => {
      if (payload.kind === "staff_claim_manual_code") {
        if (isGuardMode) {
          showToast(
            "Guard claims still require the live claim-session QR.",
            "danger"
          );
          return;
        }

        const normalizedCode = normalizeClaimCodeInput(payload.manualEntryCode);
        if (normalizedCode.length !== 6) {
          showToast("The scanned claim QR is missing a valid claim code.", "danger");
          return;
        }

        try {
          setIsResolvingClaimCode(true);
          const resolvedUser = await resolveUserByClaimCode(
            normalizedCode,
            isGuardMode
              ? { foundPostId: Number(postId) }
              : undefined
          );
          dispatchUi({ type: "set_manual_qr_session_id", value: "" });
          dispatchUi({ type: "set_manual_qr_session_token", value: "" });
          dispatchUi({ type: "set_manual_claim_code", value: normalizedCode });
          dispatchUi({ type: "set_manual_name", value: "" });
          dispatchUi({ type: "set_manual_email", value: "" });
          dispatchUi({ type: "set_search_query", value: "" });
          dispatchUi({
            type: "set_selected_user",
            value: mapResolvedClaimUserToSelectedUser(resolvedUser),
          });
          showToast("Student claim QR scanned successfully.", "success");
        } catch (error) {
          showToast(
            error instanceof Error
              ? error.message
              : "Failed to resolve the student claim QR.",
            "danger"
          );
        } finally {
          setIsResolvingClaimCode(false);
        }

        return;
      }

      if (payload.kind === "staff_claim_user_identity") {
        if (isGuardMode) {
          showToast(
            "Guard claims still require the live claim-session QR.",
            "danger"
          );
          return;
        }

        dispatchUi({ type: "set_manual_qr_session_id", value: "" });
        dispatchUi({ type: "set_manual_qr_session_token", value: "" });
        dispatchUi({ type: "set_manual_claim_code", value: "" });
        dispatchUi({ type: "set_manual_name", value: "" });
        dispatchUi({ type: "set_manual_email", value: "" });
        dispatchUi({ type: "set_search_query", value: "" });
        dispatchUi({
          type: "set_selected_user",
          value: mapStaffClaimQrToSelectedUser(payload),
        });
        showToast("Student claim QR scanned successfully.", "success");
        return;
      }

      if (!isGuardMode) {
        showToast(
          "Staff now scan the student's direct claim QR. Ask the student to open their Claim QR screen.",
          "danger"
        );
        return;
      }

      try {
        await scanMutation.mutateAsync({
          claim_qr_session_id: payload.claimQrSessionId,
          session_token: payload.sessionToken,
        });
        dispatchUi({ type: "set_manual_qr_session_id", value: "" });
        dispatchUi({ type: "set_manual_qr_session_token", value: "" });
        dispatchUi({ type: "set_manual_claim_code", value: "" });
        dispatchUi({ type: "set_selected_user", value: null });
        dispatchUi({ type: "set_search_query", value: "" });
        await sessionStatusQuery.refetch();
        showToast("Claimer verified successfully.", "success");
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to verify the claimer QR.",
          "danger"
        );
      }
    },
    [isGuardMode, postId, scanMutation, sessionStatusQuery, showToast]
  );

  const claimQrScanner = useClaimQrScanner({
    onDetected: handleVerifyClaimQr,
  });

  const lostItemPost = isGuardMode ? null : lostItemQuery.data ?? null;
  const searchResults = isGuardMode ? [] : userSearchQuery.data ?? [];
  const sessionStatus =
    sessionStatusQuery.data ?? processorSessionQuery.data ?? null;
  const joinedClaimer = sessionStatus?.verified_claimer ?? null;
  const scannedClaimer =
    sessionStatus?.status === "scanned" || sessionStatus?.status === "completed"
      ? joinedClaimer
      : null;
  const processorSessionError =
    isGuardMode && processorSessionQuery.error instanceof Error
      ? processorSessionQuery.error.message
      : null;
  const isSearching = !isGuardMode && userSearchQuery.isFetching;
  const isLoadingLostItem = !isGuardMode && lostItemQuery.isFetching;
  const lostItemError =
    !isGuardMode && lostItemQuery.error instanceof Error
      ? lostItemQuery.error.message
      : null;
  const lostItemWarning =
    !isGuardMode &&
    lostItemPost &&
    normalizeValue(lostItemPost.post_status) === "pending"
      ? "This linked lost item post is still pending. It will be accepted automatically when you submit the claim."
      : null;
  const isSubmitting = claimMutation.isPending;
  const isVerifyingClaimer = scanMutation.isPending;

  const hasUnsavedChanges = useMemo(
    () =>
      ui.selectedUser !== null ||
      formData.contactNumber !== "" ||
      formData.lostItemId !== "" ||
      ui.manualClaimCode !== "",
    [formData.contactNumber, formData.lostItemId, ui.manualClaimCode, ui.selectedUser]
  );

  useEffect(() => {
    if (!ui.toast) return;
    const timer = window.setTimeout(
      () => dispatchUi({ type: "set_toast", value: null }),
      3000
    );
    return () => window.clearTimeout(timer);
  }, [ui.toast]);

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (postQuery.error) {
      showToast("Failed to load post", "danger");
    }
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
    dispatchUi({ type: "set_manual_claim_code", value: "" });
    dispatchUi({ type: "set_search_query", value: "" });
    if (ui.showManualInput) {
      dispatchUi({ type: "toggle_manual_input" });
    }
  };

  const handleManualSubmit = () => {
    const emailPattern = /^[a-zA-Z0-9._-]+@umak\.edu\.ph$/;
    if (!ui.manualEmail.trim() || !emailPattern.test(ui.manualEmail)) {
      showToast(
        "Please enter a valid UMak email (e.g., user@umak.edu.ph)",
        "danger"
      );
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
    dispatchUi({ type: "set_manual_claim_code", value: "" });
    if (ui.showManualInput) {
      dispatchUi({ type: "toggle_manual_input" });
    }
  };

  const handleResolveClaimCode = async () => {
    const normalizedCode = normalizeClaimCodeInput(ui.manualClaimCode);

    if (normalizedCode.length !== 6) {
      showToast("Enter the full 6-character claim code first.", "danger");
      return;
    }

    try {
      setIsResolvingClaimCode(true);
      const resolvedUser = await resolveUserByClaimCode(
        normalizedCode,
        isGuardMode
          ? { foundPostId: Number(postId) }
          : undefined
      );
      dispatchUi({ type: "set_manual_claim_code", value: normalizedCode });
      dispatchUi({
        type: "set_selected_user",
        value: mapResolvedClaimUserToSelectedUser(resolvedUser),
      });
      dispatchUi({ type: "set_search_query", value: "" });
      showToast("Claim code matched successfully.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to resolve the claim code.",
        "danger"
      );
    } finally {
      setIsResolvingClaimCode(false);
    }
  };

  const handleSubmit = async () => {
    dispatchUi({ type: "set_modal", modal: "showConfirmModal", value: false });
    if (isSubmitting || isRedirectingAfterClaim || !post) return;

    const latestPostResult = await postQuery.refetch();
    const latestPost = latestPostResult.data;
    if (
      !latestPost ||
      normalizeValue(latestPost.item_type) !== "found" ||
      normalizeValue(latestPost.post_status) !== "accepted" ||
      normalizeValue(latestPost.item_status) !== "unclaimed" ||
      normalizeValue(latestPost.custody_status) !==
        (isGuardMode ? "with_guard" : "in_security_office")
    ) {
      showToast("This found post is not ready to be claimed.", "danger");
      return;
    }

    const normalizedPhoneNumberValue = normalizePhoneNumber(formData.contactNumber);
    if (!normalizedPhoneNumberValue) {
      showToast(
        "Please enter a valid Philippine mobile number (e.g., 09123456789, +639123456789)",
        "danger"
      );
      return;
    }

    if (!isGuardMode && formData.lostItemId.trim() && !lostItemPost) {
      showToast(
        lostItemError ??
          "Referenced lost post not found. Please verify the shared link or Item ID.",
        "danger"
      );
      return;
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

    const claimerIdentity = scannedClaimer ?? ui.selectedUser;
    if (!claimerIdentity) {
      showToast(
        isGuardMode
          ? "Verify the claimer QR before submitting the guard claim."
          : "Scan the student QR or use manual staff entry before submitting the claim.",
        "danger"
      );
      return;
    }

    if (
      isGuardMode &&
      (!sessionStatus || !scannedClaimer || sessionStatus.status !== "scanned")
    ) {
      showToast(
        "Guard claims require a live QR verification before submission.",
        "danger"
      );
      return;
    }

    const request: ProcessClaimRequest = {
      found_post_id: Number(postId),
      missing_post_id:
        !isGuardMode && lostItemPost ? Number(lostItemPost.post_id) : null,
      claim_details: {
        claimer_name: claimerIdentity.user_name,
        claimer_school_email: claimerIdentity.email,
        claimer_contact_num: formatPhoneNumber(normalizedPhoneNumberValue),
        claimed_at: claimedAt.toISOString(),
        poster_name: post.is_anonymous
          ? "Anonymous"
          : post.poster_name ?? "Unknown User",
        staff_id: currentUser.user_id,
        staff_name:
          currentUser.user_name ?? (isGuardMode ? "Guard User" : "Staff User"),
      },
      ...(isGuardMode && scannedClaimer && sessionStatus
        ? {
            claim_verification: {
              claim_verification_session_id:
                sessionStatus.claim_verification_session_id,
              verification_method: isGuardMode ? "guard_qr" : "staff_qr",
            },
          }
        : {}),
    };

    try {
      await claimMutation.mutateAsync(request);
      setIsRedirectingAfterClaim(true);
      showToast("Item claimed successfully", "success");
      redirectTimerRef.current = window.setTimeout(() => {
        router.push(backPath);
      }, 1500);
    } catch (error) {
      logError("Claim submission error:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to claim item. Please try again.",
        "danger"
      );
    }
  };

  if (postQuery.isLoading) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Post not found or cannot be claimed
          </h1>
        </div>
      </section>
    );
  }

  if (claimBlockedMessage) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Post not ready for claim
          </h1>
          <p className="mt-2 text-sm text-slate-600">{claimBlockedMessage}</p>
        </div>
      </section>
    );
  }

  if (isGuardMode && !processorSessionQuery.isLoading && processorSessionError) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Claim verification unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">{processorSessionError}</p>
        </div>
      </section>
    );
  }

  const isFormValid =
    Boolean(scannedClaimer ?? ui.selectedUser) &&
    formData.contactNumber.trim() !== "" &&
    formData.claimedAt.trim() !== "" &&
    normalizePhoneNumber(formData.contactNumber) !== null &&
    (isGuardMode || !formData.lostItemId.trim() || lostItemPost !== null) &&
    (!isGuardMode || processorSessionQuery.isSuccess) &&
    (!isGuardMode || sessionStatus?.status === "scanned");

  return (
    <PhotoProvider>
      <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-1">
        <ClaimToolbar
          backLabel={isGuardMode ? "Back to Active Reviews" : "Back to Post Records"}
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          submitLabel="Claim Item"
          onBack={() => {
            if (hasUnsavedChanges) {
              dispatchUi({
                type: "set_modal",
                modal: "showCancelModal",
                value: true,
              });
              return;
            }

            router.push(backPath);
          }}
          onSubmit={() =>
            dispatchUi({
              type: "set_modal",
              modal: "showConfirmModal",
              value: true,
            })
          }
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-12">
          <FoundItemPanel post={post} lostItemPost={lostItemPost} />
          <ClaimSidebar
            mode={mode}
            selectedUser={ui.selectedUser}
            scannedClaimer={scannedClaimer}
            searchQuery={ui.searchQuery}
            searchResults={searchResults}
            isSearching={Boolean(isSearching)}
            showManualInput={ui.showManualInput}
            manualName={ui.manualName}
            manualEmail={ui.manualEmail}
            formData={formData}
            lostItemPost={lostItemPost}
            lostItemWarning={lostItemWarning}
            isLoadingLostItem={Boolean(isLoadingLostItem)}
            lostItemError={lostItemError}
            onToggleManualInput={() => dispatchUi({ type: "toggle_manual_input" })}
            onSearchQueryChange={(value) =>
              dispatchUi({ type: "set_search_query", value })
            }
            onUserSelect={handleUserSelect}
            onClearUser={() => {
              dispatchUi({ type: "set_selected_user", value: null });
              dispatchUi({ type: "set_manual_claim_code", value: "" });
            }}
            onManualNameChange={(value) =>
              dispatchUi({ type: "set_manual_name", value })
            }
            onManualEmailChange={(value) =>
              dispatchUi({ type: "set_manual_email", value })
            }
            onSubmitManual={handleManualSubmit}
            onFieldChange={(key, value) =>
              dispatchForm({ type: "set_field", key, value })
            }
            onViewLostItemPost={() => {
              if (lostItemPost) {
                router.push(`/staff/post-record/view/${lostItemPost.post_id}`);
              }
            }}
            verificationPanel={
              <ClaimVerificationPanel
                joinCode={isGuardMode ? sessionStatus?.join_code ?? null : null}
                isSessionLoading={
                  processorSessionQuery.isLoading || sessionStatusQuery.isLoading
                }
                isScannerSupported={claimQrScanner.isSupported}
                isVerifying={isVerifyingClaimer}
                isResolvingClaimCode={isResolvingClaimCode}
                manualClaimCode={ui.manualClaimCode}
                manualQrSessionId={ui.manualQrSessionId}
                manualQrSessionToken={ui.manualQrSessionToken}
                mode={mode}
                scannerState={claimQrScanner.state}
                sessionStatus={isGuardMode ? sessionStatus : null}
                joinedClaimer={isGuardMode ? joinedClaimer : null}
                videoRef={claimQrScanner.videoRef}
                onCloseCamera={claimQrScanner.closeCamera}
                onManualClaimCodeChange={(value) =>
                  dispatchUi({
                    type: "set_manual_claim_code",
                    value: normalizeClaimCodeInput(value),
                  })
                }
                onManualQrSessionIdChange={(value) =>
                  dispatchUi({ type: "set_manual_qr_session_id", value })
                }
                onManualQrSessionTokenChange={(value) =>
                  dispatchUi({ type: "set_manual_qr_session_token", value })
                }
                onOpenCamera={() => void claimQrScanner.openCamera()}
                onResolveClaimCode={() => void handleResolveClaimCode()}
                onVerifyManualEntry={() =>
                  void handleVerifyClaimQr({
                    kind: "claim_session",
                    claimQrSessionId: ui.manualQrSessionId,
                    sessionToken: ui.manualQrSessionToken,
                  })
                }
              />
            }
          />
        </div>

        <ClaimModals
          showConfirmModal={ui.showConfirmModal}
          showCancelModal={ui.showCancelModal}
          selectedUserName={scannedClaimer?.user_name ?? ui.selectedUser?.user_name}
          isSubmitting={isSubmitting}
          onCloseConfirm={() =>
            dispatchUi({
              type: "set_modal",
              modal: "showConfirmModal",
              value: false,
            })
          }
          onConfirm={() => void handleSubmit()}
          onCloseCancel={() =>
            dispatchUi({
              type: "set_modal",
              modal: "showCancelModal",
              value: false,
            })
          }
          onDiscard={() => router.push(backPath)}
        />

        {ui.toast ? (
          <CustomToast
            message={ui.toast.message}
            tone={ui.toast.tone}
            mode="floating"
          />
        ) : null}
      </section>
    </PhotoProvider>
  );
}
