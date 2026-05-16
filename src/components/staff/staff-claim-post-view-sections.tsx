"use client";

import type { ReactNode, Ref } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  CircleUserRound,
  Clock,
  Mail,
  Phone,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { PhotoView } from "react-photo-view";
import { Overlay } from "@/components/ui/overlay";
import type {
  ClaimFormData,
  SelectedUser,
} from "@/components/staff/staff-claim-post-view-state";
import type { ClaimQrScannerState } from "@/hooks/use-claim-qr-scanner";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import type {
  ClaimVerificationSessionStatusResponse,
  ClaimVerifiedClaimerSummary,
} from "@/types/claim-verification";
import type { ApiPostRecordDetails } from "@/types/post-record-api";
import type { UserSearchResult } from "@/types/user-search";

type ClaimPageMode = "staff" | "guard";

function formatVerificationStatus(
  status: ClaimVerificationSessionStatusResponse["status"] | undefined
): string {
  if (!status) return "Starting session";

  return status.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function getVerificationTone(status: ClaimVerificationSessionStatusResponse["status"] | undefined) {
  if (status === "scanned" || status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "expired" || status === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function renderUserAvatar(
  user: Pick<SelectedUser, "profile_picture_url" | "user_name"> | ClaimVerifiedClaimerSummary,
  sizeClassName: string
) {
  return (
    <div
      className={`flex ${sizeClassName} items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500`}
    >
      {user.profile_picture_url ? (
        <Image
          src={user.profile_picture_url}
          alt={user.user_name}
          width={48}
          height={48}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <User className="size-5" />
      )}
    </div>
  );
}

export function ClaimToolbar(props: {
  backLabel: string;
  isFormValid: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={props.onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" /> {props.backLabel}
        </button>
        <button
          type="button"
          disabled={!props.isFormValid || props.isSubmitting}
          onClick={props.onSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
        >
          <Check className="size-4" /> {props.isSubmitting ? "Claiming..." : props.submitLabel}
        </button>
      </div>
    </article>
  );
}

export function FoundItemPanel(props: {
  post: ApiPostRecordDetails;
  lostItemPost: ApiPostRecordDetails | null;
}) {
  const { post, lostItemPost } = props;
  return (
    <article className="min-h-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-7">
      <h2 className="mb-3 text-lg font-semibold text-[#1D2981]">Item to be Claimed</h2>
      <p className="mb-3 text-sm text-slate-600">
        Review the found item details before processing the claim.
      </p>

      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
          {post.poster_profile_picture_url ? (
            <Image
              src={post.poster_profile_picture_url}
              alt={post.poster_name}
              width={40}
              height={40}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <CircleUserRound className="size-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {post.is_anonymous ? "Anonymous" : post.poster_name}
          </p>
          <p className="text-xs text-slate-500">
            Found {formatDateTimeInPhilippineTime(post.submitted_on_date_local, "Unknown")}
          </p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{post.item_name}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {post.item_description ?? "No description provided."}
      </p>

      {post.item_image_url ? (
        <PhotoView src={post.item_image_url}>
          <div className="relative mt-4 h-64 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 md:h-80">
            <Image
              src={post.item_image_url}
              alt={post.item_name}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        </PhotoView>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-700">Category:</span>{" "}
          {post.category ?? "N/A"}
        </p>
        <p>
          <span className="font-medium text-slate-700">Last seen location:</span>{" "}
          {post.last_seen_location ?? "N/A"}
        </p>
        <p>
          <span className="font-medium text-slate-700">Last seen at:</span>{" "}
          {formatDateTimeInPhilippineTime(post.last_seen_at, "N/A")}
        </p>
      </div>

      {lostItemPost ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 text-sm font-semibold text-emerald-800">Linked Lost Item</p>
          <div className="flex gap-4">
            {lostItemPost.item_image_url ? (
              <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-emerald-200">
                <Image
                  src={lostItemPost.item_image_url}
                  alt={lostItemPost.item_name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-900">{lostItemPost.item_name}</p>
              <p className="mt-1 text-slate-600">{lostItemPost.item_description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Posted by {lostItemPost.is_anonymous ? "Anonymous" : lostItemPost.poster_name}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ClaimVerificationPanel({
  joinCode,
  isSessionLoading,
  isScannerSupported,
  isVerifying,
  isResolvingClaimCode,
  manualClaimCode,
  manualQrSessionId,
  manualQrSessionToken,
  mode,
  scannerState,
  sessionStatus,
  joinedClaimer,
  videoRef,
  onCloseCamera,
  onManualClaimCodeChange,
  onManualQrSessionIdChange,
  onManualQrSessionTokenChange,
  onOpenCamera,
  onResolveClaimCode,
  onVerifyManualEntry,
}: {
  joinCode: string | null;
  isSessionLoading: boolean;
  isScannerSupported: boolean;
  isVerifying: boolean;
  isResolvingClaimCode: boolean;
  manualClaimCode: string;
  manualQrSessionId: string;
  manualQrSessionToken: string;
  mode: ClaimPageMode;
  scannerState: ClaimQrScannerState;
  sessionStatus: ClaimVerificationSessionStatusResponse | null;
  joinedClaimer: ClaimVerifiedClaimerSummary | null;
  videoRef: Ref<HTMLVideoElement>;
  onCloseCamera: () => void;
  onManualClaimCodeChange: (value: string) => void;
  onManualQrSessionIdChange: (value: string) => void;
  onManualQrSessionTokenChange: (value: string) => void;
  onOpenCamera: () => void;
  onResolveClaimCode: () => void;
  onVerifyManualEntry: () => void;
}) {
  const status = sessionStatus?.status;
  const showCameraPreview = scannerState.isOpen;
  const isQrVerified = status === "scanned" || status === "completed";
  const statusLabel = mode === "guard" ? formatVerificationStatus(status) : "Direct QR";
  const statusTone =
    mode === "guard"
      ? getVerificationTone(status)
      : "border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1D2981]">
            {mode === "guard" ? "Claim Verification" : "Student Claim QR"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "guard"
              ? "Guard claims require a live QR verification before you can submit."
              : "Ask the student to open their claim QR in UMak-LINK, then scan it here. Staff can still search or type a claimer manually if needed."}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}
        >
          {statusLabel}
        </span>
      </div>

      {mode === "guard" ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Join Code
          </p>
          <p className="mt-2 text-2xl font-bold tracking-[0.2em] text-slate-900">
            {isSessionLoading ? "Loading..." : joinCode ?? "Unavailable"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Ask the claimer to open UMak-LINK, join the claim session, then generate the unique claim QR for this item.
          </p>
        </div>
      ) : null}

      {mode === "guard" && joinedClaimer ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            {renderUserAvatar(joinedClaimer, "size-12")}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                {isQrVerified ? "QR Verified Claimer" : "Joined Claimer"}
              </p>
              <p className="truncate text-base font-semibold text-slate-900">
                {joinedClaimer.user_name}
              </p>
              <p className="truncate text-sm text-slate-600">
                {joinedClaimer.email}
              </p>
            </div>
            <ShieldCheck className="ml-auto size-5 text-emerald-600" />
          </div>
          {!isQrVerified ? (
            <p className="mt-3 text-sm text-emerald-800/80">
              The student joined the session. Scan the live QR before using the student identity for claim submission.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Camera Scanner</p>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "guard"
                ? "Point the camera at the claimer's live QR to verify the session."
                : "Point the camera at the student's claim QR to fill in the claimer details."}
            </p>
          </div>
          {showCameraPreview ? (
            <button
              type="button"
              onClick={onCloseCamera}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Close camera
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenCamera}
              disabled={!isScannerSupported || isVerifying}
              className="inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
            >
              <ScanLine className="size-4" /> Open camera
            </button>
          )}
        </div>

        {showCameraPreview ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full object-cover"
              autoPlay
              muted
              playsInline
            />
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            <QrCode className="size-8 text-slate-400" />
            <p className="mt-3 max-w-sm">{scannerState.message}</p>
          </div>
        )}
      </div>

      {mode === "guard" ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Manual QR Entry</p>
          <p className="mt-1 text-sm text-slate-600">
            Use this fallback if the browser cannot scan the claimer&apos;s QR code.
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Claim QR Session ID
              </label>
              <input
                value={manualQrSessionId}
                onChange={(event) => onManualQrSessionIdChange(event.target.value)}
                placeholder="Paste the claim_qr_session_id"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Session Token
              </label>
              <input
                value={manualQrSessionToken}
                onChange={(event) => onManualQrSessionTokenChange(event.target.value)}
                placeholder="Paste the session_token"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
            </div>
            <button
              type="button"
              onClick={onVerifyManualEntry}
              disabled={
                isVerifying ||
                !manualQrSessionId.trim() ||
                !manualQrSessionToken.trim()
              }
              className="w-full rounded-full border border-[#1D2981] bg-white px-4 py-2 text-sm font-medium text-[#1D2981] hover:bg-[#1D2981] hover:text-white disabled:opacity-60"
            >
              {isVerifying ? "Verifying..." : "Verify Claimer"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Manual Claim Code</p>
          <p className="mt-1 text-sm text-slate-600">
            If the camera cannot scan the student&apos;s QR, ask them to read the
            6-character claim code shown below their QR.
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Claim Code
              </label>
              <input
                value={manualClaimCode}
                onChange={(event) => onManualClaimCodeChange(event.target.value)}
                placeholder="Enter the 6-character code"
                maxLength={6}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
            </div>
            <button
              type="button"
              onClick={onResolveClaimCode}
              disabled={isResolvingClaimCode || manualClaimCode.trim().length !== 6}
              className="w-full rounded-full border border-[#1D2981] bg-white px-4 py-2 text-sm font-medium text-[#1D2981] hover:bg-[#1D2981] hover:text-white disabled:opacity-60"
            >
              {isResolvingClaimCode ? "Loading..." : "Use Claim Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClaimSidebar(props: {
  mode: ClaimPageMode;
  selectedUser: SelectedUser | null;
  scannedClaimer: ClaimVerifiedClaimerSummary | null;
  searchQuery: string;
  searchResults: UserSearchResult[];
  isSearching: boolean;
  showManualInput: boolean;
  manualName: string;
  manualEmail: string;
  formData: ClaimFormData;
  isLoadingLostItem: boolean;
  lostItemError: string | null;
  onToggleManualInput: () => void;
  onSearchQueryChange: (value: string) => void;
  onUserSelect: (user: UserSearchResult) => void;
  onClearUser: () => void;
  onManualNameChange: (value: string) => void;
  onManualEmailChange: (value: string) => void;
  onSubmitManual: () => void;
  onFieldChange: (key: keyof ClaimFormData, value: string) => void;
  verificationPanel: ReactNode;
}) {
  const isGuardMode = props.mode === "guard";
  const showManualIdentityTools = !isGuardMode && !props.scannedClaimer;

  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-5">
      {props.verificationPanel}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1D2981]">
            Claimer Identity <span className="text-rose-600">*</span>
          </p>
          {showManualIdentityTools ? (
            <button
              type="button"
              onClick={props.onToggleManualInput}
              className="rounded-full border border-[#1D2981] bg-white px-3 py-1.5 text-xs font-medium text-[#1D2981] transition-colors hover:bg-[#1D2981] hover:text-white"
            >
              {props.showManualInput ? "Switch to Search" : "Manual Input"}
            </button>
          ) : null}
        </div>

        {props.scannedClaimer ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-3">
              {renderUserAvatar(props.scannedClaimer, "size-10")}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {props.scannedClaimer.user_name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {props.scannedClaimer.email}
                </p>
              </div>
              <span className="ml-auto rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                QR verified
              </span>
            </div>
          </div>
        ) : props.selectedUser ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderUserAvatar(props.selectedUser, "size-10")}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {props.selectedUser.user_name}
                  </p>
                  <p className="text-xs text-slate-500">{props.selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={props.onClearUser}
                className="rounded-full p-1 hover:bg-slate-200"
              >
                <X className="size-4 text-slate-600" />
              </button>
            </div>
          </div>
        ) : showManualIdentityTools ? (
          !props.showManualInput ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="claimer-search" className="sr-only">
                Search by name or email
              </label>
              <input
                id="claimer-search"
                value={props.searchQuery}
                onChange={(event) => props.onSearchQueryChange(event.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
              />
              {props.searchResults.length > 0 ? (
                <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {props.searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      type="button"
                      onClick={() => props.onUserSelect(user)}
                      className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 last:border-b-0"
                    >
                      {renderUserAvatar(
                        {
                          profile_picture_url: user.profile_picture_url ?? null,
                          user_name: user.user_name,
                        },
                        "size-8"
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {user.user_name}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
              {props.isSearching ? (
                <div className="mt-2 text-center text-xs text-slate-500">Searching...</div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  value={props.manualName}
                  onChange={(event) => props.onManualNameChange(event.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  UMak Email
                </label>
                <input
                  type="email"
                  value={props.manualEmail}
                  onChange={(event) => props.onManualEmailChange(event.target.value)}
                  placeholder="user@umak.edu.ph"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
                />
              </div>
              <button
                type="button"
                onClick={props.onSubmitManual}
                disabled={!props.manualName.trim() || !props.manualEmail.trim()}
                className="w-full rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
              >
                Add Claimer
              </button>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Scan or manually verify the claimer&apos;s QR code to unlock the guard claim.
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
          <Phone className="size-4" />
          Contact Number <span className="text-rose-600">*</span>
        </label>
        <input
          type="tel"
          value={props.formData.contactNumber}
          onChange={(event) => props.onFieldChange("contactNumber", event.target.value)}
          placeholder="0912 345 6789"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
        />
        <p className="mt-1 text-xs text-slate-500">Philippine mobile number</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
          <Clock className="size-4" />
          Claimed At <span className="text-rose-600">*</span>
        </label>
        <input
          type="datetime-local"
          value={props.formData.claimedAt}
          onChange={(event) => props.onFieldChange("claimedAt", event.target.value)}
          max={new Date().toISOString().slice(0, 16)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
        />
      </div>

      {!isGuardMode ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
            <Mail className="size-4" />
            Lost Item ID (Optional)
          </label>
          <input
            type="text"
            value={props.formData.lostItemId}
            onChange={(event) => props.onFieldChange("lostItemId", event.target.value)}
            placeholder="Enter Item ID if linking to lost post"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
          />
          {props.isLoadingLostItem ? (
            <p className="mt-2 text-xs text-slate-500">Loading lost item...</p>
          ) : null}
          {props.lostItemError ? (
            <p className="mt-2 text-xs text-rose-600">{props.lostItemError}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

export function ClaimModals(props: {
  showConfirmModal: boolean;
  showCancelModal: boolean;
  selectedUserName: string | undefined;
  isSubmitting: boolean;
  onCloseConfirm: () => void;
  onConfirm: () => void;
  onCloseCancel: () => void;
  onDiscard: () => void;
}) {
  return (
    <>
      {props.showConfirmModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Confirm Claim</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to claim this item for {props.selectedUserName}?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={props.onCloseConfirm}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={props.isSubmitting}
                onClick={props.onConfirm}
                className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
              >
                {props.isSubmitting ? "Claiming..." : "Confirm"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {props.showCancelModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Discard Changes?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={props.onCloseCancel}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={props.onDiscard}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Discard
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
