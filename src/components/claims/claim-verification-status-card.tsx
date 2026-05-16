import { BadgeCheck, Clock3, RefreshCw, UserRoundCheck } from "lucide-react";
import type { ClaimVerificationSessionStatusResponse } from "@/types/claim-verification";

interface ClaimVerificationStatusCardProps {
  errorMessage: string | null;
  isLoading: boolean;
  sessionStatus: ClaimVerificationSessionStatusResponse | null;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusCopy(
  sessionStatus: ClaimVerificationSessionStatusResponse | null
): string {
  if (!sessionStatus) {
    return "Preparing the claim verification session.";
  }

  if (sessionStatus.status === "awaiting_claimer") {
    return "Share the join code with the claimer so they can open the live QR in UMak-LINK.";
  }

  if (sessionStatus.status === "qr_active") {
    return "The claimer joined the session. Scan the live QR or use the manual QR payload fields below.";
  }

  if (sessionStatus.status === "scanned") {
    return "The claimer QR has been scanned. Review the verified identity, then finish the claim form.";
  }

  if (sessionStatus.status === "completed") {
    return "This verification session is complete. The claim was already finalized.";
  }

  if (sessionStatus.status === "cancelled") {
    return "The claimer cancelled this verification session.";
  }

  if (sessionStatus.current_window_expired) {
    return "The current QR window expired. The claimer must refresh the QR from UMak-LINK.";
  }

  return "This verification session expired before the claim could be completed.";
}

export function ClaimVerificationStatusCard({
  errorMessage,
  isLoading,
  sessionStatus,
}: ClaimVerificationStatusCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1D2981]">Claim Verification</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Live QR Session
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
          {sessionStatus?.status ?? (isLoading ? "loading" : "pending")}
        </span>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-slate-700">
        {getStatusCopy(sessionStatus)}
      </p>

      {sessionStatus ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <BadgeCheck className="size-4" />
                Join Code
              </div>
              <p className="mt-3 font-mono text-2xl font-bold tracking-[0.28em] text-slate-900">
                {sessionStatus.join_code}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Clock3 className="size-4" />
                Current Expiry
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {formatDateTime(sessionStatus.expires_at)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <RefreshCw className="size-4" />
                QR Window
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {sessionStatus.number_of_attempts} / {sessionStatus.max_number_of_attempts}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {sessionStatus.retries_remaining} retries remaining
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <UserRoundCheck className="size-4" />
                QR Progress
              </div>
              <p className="mt-3 text-sm font-semibold capitalize text-slate-900">
                {sessionStatus.qr_status ?? "waiting"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Scanned at {formatDateTime(sessionStatus.scanned_at)}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
}
