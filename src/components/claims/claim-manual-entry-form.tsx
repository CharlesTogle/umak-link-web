"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClaimQrManualEntryPayload } from "@/types/claim-verification";

interface ClaimManualEntryFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: ClaimQrManualEntryPayload) => Promise<void>;
}

export function ClaimManualEntryForm({
  isSubmitting,
  onSubmit,
}: ClaimManualEntryFormProps) {
  const [claimQrSessionId, setClaimQrSessionId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async () => {
    const trimmedClaimQrSessionId = claimQrSessionId.trim();
    const trimmedSessionToken = sessionToken.trim();

    if (!trimmedClaimQrSessionId || !trimmedSessionToken) {
      setValidationError("Claim QR session ID and session token are required.");
      return;
    }

    setValidationError("");
    await onSubmit({
      kind: "claim_session",
      claimQrSessionId: trimmedClaimQrSessionId,
      sessionToken: trimmedSessionToken,
    });
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="claim-qr-session-id"
            className="text-sm font-semibold text-slate-800"
          >
            Claim QR Session ID
          </label>
          <input
            id="claim-qr-session-id"
            value={claimQrSessionId}
            placeholder="Paste the claim QR session ID"
            onChange={(event) => setClaimQrSessionId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1D2981] focus:ring-2 focus:ring-[#1D2981]/15"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="claim-session-token"
            className="text-sm font-semibold text-slate-800"
          >
            Session Token
          </label>
          <input
            id="claim-session-token"
            value={sessionToken}
            placeholder="Paste the session token"
            onChange={(event) => setSessionToken(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1D2981] focus:ring-2 focus:ring-[#1D2981]/15"
          />
        </div>

        {validationError ? (
          <p className="text-sm text-rose-600">{validationError}</p>
        ) : null}

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="w-full bg-[#1D2981] text-white hover:bg-[#17216b]"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Verifying Claimer
            </>
          ) : (
            "Verify Claimer from QR Payload"
          )}
        </Button>
      </div>
    </article>
  );
}
