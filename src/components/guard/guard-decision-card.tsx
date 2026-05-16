"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";

interface GuardDecisionCardProps {
  decisionReason: string;
  isSubmitting: boolean;
  onDecisionReasonChange: (value: string) => void;
  onAccept: () => void;
  onReject: () => void;
}

export function GuardDecisionCard({
  decisionReason,
  isSubmitting,
  onDecisionReasonChange,
  onAccept,
  onReject,
}: GuardDecisionCardProps) {
  return (
    <GuardSurfaceCard
      title="Decision"
      subtitle="Record your decision for this custody attempt. Rejection keeps the item with the student."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="guard-decision-reason"
            className="text-sm font-semibold text-slate-800"
          >
            Optional reason
          </label>
          <textarea
            id="guard-decision-reason"
            value={decisionReason}
            rows={4}
            placeholder="Add a note for the audit trail if needed."
            onChange={(event) => onDecisionReasonChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1D2981] focus:ring-2 focus:ring-[#1D2981]/15"
          />
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              "Accept Handover"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            disabled={isSubmitting}
            className="w-full border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Reject Handover
          </Button>
        </div>
      </div>
    </GuardSurfaceCard>
  );
}
