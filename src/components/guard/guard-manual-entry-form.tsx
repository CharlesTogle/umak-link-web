"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeClaimCodeInput } from "@/lib/claim-code";
import type { GuardManualEntryPayload } from "@/types/guard-custody";

interface GuardManualEntryFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: GuardManualEntryPayload) => Promise<void>;
}

export function GuardManualEntryForm({
  isSubmitting,
  onSubmit,
}: GuardManualEntryFormProps) {
  const [manualEntryCode, setManualEntryCode] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async () => {
    const trimmedManualEntryCode = normalizeClaimCodeInput(manualEntryCode);

    if (!trimmedManualEntryCode) {
      setValidationError("Manual entry code is required.");
      return;
    }

    setValidationError("");
    await onSubmit({
      manualEntryCode: trimmedManualEntryCode,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="guard-manual-entry-code"
          className="text-sm font-semibold text-slate-800"
        >
          Manual Entry Code
        </label>
        <input
          id="guard-manual-entry-code"
          value={manualEntryCode}
          placeholder="Enter the 6-character code"
          onChange={(event) => {
            setValidationError("");
            setManualEntryCode(normalizeClaimCodeInput(event.target.value));
          }}
          maxLength={6}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1D2981] focus:ring-2 focus:ring-[#1D2981]/15"
        />
        <p className="text-sm leading-6 text-slate-600">
          Only the code shown on the student&apos;s handover screen is needed here.
        </p>
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
            Loading Review
          </>
        ) : (
          "Load Handover Review"
        )}
      </Button>
    </div>
  );
}
