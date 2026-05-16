"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import { GuardDecisionCard } from "@/components/guard/guard-decision-card";
import { GuardPageSectionHeader } from "@/components/guard/guard-page-section-header";
import { GuardReviewMissingState } from "@/components/guard/guard-review-missing-state";
import { GuardReviewSummaryCard } from "@/components/guard/guard-review-summary-card";
import { GuardStatusBanner } from "@/components/guard/guard-status-banner";
import { CustomToast, type CustomToastTone } from "@/components/ui/custom-toast";
import { useGuardDecisionMutation } from "@/hooks/mutations/guard-custody-mutations";
import {
  clearActiveGuardScanSession,
  readActiveGuardScanSession,
  storeLastGuardDecision,
} from "@/lib/guard-session-storage";
import type {
  GuardDecisionRequest,
  StoredGuardScanSession,
} from "@/types/guard-custody";

interface GuardReviewViewProps {
  custodyAttemptId: string;
}

interface GuardToastState {
  message: string;
  tone: CustomToastTone;
}

function findStoredSession(custodyAttemptId: string): StoredGuardScanSession | null {
  const storedSession = readActiveGuardScanSession();
  if (!storedSession) return null;

  return storedSession.scan.custody_attempt_id === custodyAttemptId
    ? storedSession
    : null;
}

export function GuardReviewView({
  custodyAttemptId,
}: GuardReviewViewProps) {
  const router = useRouter();
  const [decisionReason, setDecisionReason] = useState("");
  const [toast, setToast] = useState<GuardToastState | null>(null);
  const guardDecisionMutation = useGuardDecisionMutation(custodyAttemptId);
  const storedSession = useMemo(
    () => findStoredSession(custodyAttemptId),
    [custodyAttemptId]
  );

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  const scan = useMemo(() => storedSession?.scan ?? null, [storedSession]);

  const handleDecision = async (decision: GuardDecisionRequest["decision"]) => {
    if (!scan) return;

    try {
      const payload: GuardDecisionRequest = {
        qr_code_session_id: scan.qr_code_session_id,
        decision,
        ...(decisionReason.trim()
          ? { decision_reason: decisionReason.trim() }
          : {}),
      };

      const response = await guardDecisionMutation.mutateAsync(payload);

      clearActiveGuardScanSession();
      storeLastGuardDecision({
        custody_attempt_id: response.custody_attempt_id,
        qr_code_session_id: response.qr_code_session_id,
        attempt_status: response.attempt_status,
        decision_at: response.decision_at,
        item_name: scan.item_name,
        guard_post_name: scan.guard_post_name,
      });

      router.push("/guard");
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the guard decision.",
        tone: "danger",
      });
    }
  };

  if (!storedSession || !scan) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 gap-4">
        <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <GuardPageSectionHeader
            title="Review Handover"
            subtitle="Open a saved scan review before making a guard decision."
            icon={FileText}
          />
          <div className="bg-[#f6fafc] p-5">
            <GuardReviewMissingState
              onOpenScan={() => router.push("/guard/scan")}
              onReturnHome={() => router.push("/guard")}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
      <section className="grid h-full min-h-0 grid-cols-1 gap-4">
        <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <GuardPageSectionHeader
            title="Review Handover"
            subtitle="Check the student handover details before accepting or rejecting."
            icon={FileText}
          />
          <div className="space-y-4 bg-[#f6fafc] p-5">
            <GuardStatusBanner
              tone="warning"
              title="Review before acting"
              description="Verify that the item, the selected post, and the handover image match the physical handover before you accept custody."
            />
            <PhotoProvider>
              <GuardReviewSummaryCard scan={scan} />
            </PhotoProvider>
            <GuardDecisionCard
              decisionReason={decisionReason}
              isSubmitting={guardDecisionMutation.isPending}
              onDecisionReasonChange={setDecisionReason}
              onAccept={() => void handleDecision("accepted")}
              onReject={() => void handleDecision("rejected")}
            />
          </div>
        </div>
      </section>
    </>
  );
}
