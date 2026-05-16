"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GuardPageSectionHeader } from "@/components/guard/guard-page-section-header";
import { GuardSessionSummary } from "@/components/guard/guard-session-summary";
import { GuardStatusBanner } from "@/components/guard/guard-status-banner";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";
import {
  clearLastGuardDecision,
  readActiveGuardScanSession,
  readLastGuardDecision,
} from "@/lib/guard-session-storage";
import type {
  GuardDecisionSummary,
  StoredGuardScanSession,
} from "@/types/guard-custody";

export function GuardHomeView() {
  const router = useRouter();
  const [activeSession] = useState<StoredGuardScanSession | null>(
    () => readActiveGuardScanSession()
  );
  const [latestDecision, setLatestDecision] = useState<GuardDecisionSummary | null>(
    () => readLastGuardDecision()
  );

  const handleDismissDecision = () => {
    clearLastGuardDecision();
    setLatestDecision(null);
  };

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-4">
      <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <GuardPageSectionHeader
          title="Guard Handover"
          subtitle="Review student handovers and continue saved guard sessions."
          icon={ShieldCheck}
        />
        <div className="space-y-4 bg-[#f6fafc] p-5">
          {latestDecision ? (
            <GuardStatusBanner
              tone={latestDecision.attempt_status === "accepted" ? "success" : "warning"}
              title={
                latestDecision.attempt_status === "accepted"
                  ? "Handover accepted"
                  : "Handover rejected"
              }
              description={`The latest guard decision for ${latestDecision.item_name} was recorded successfully.`}
            />
          ) : null}

          <GuardSurfaceCard
            title="Start Review"
            subtitle="Open the scan flow when a student presents a custody QR. The item stays with the student until you accept."
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#1D2981] px-4 py-5 text-white shadow-sm">
                <p className="text-sm font-semibold text-blue-100">
                  Start from the scan flow whenever a student presents the QR.
                </p>
                <h1 className="mt-2 text-xl font-extrabold">
                  Review custody handovers with a clear audit trail.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-blue-50">
                  Validate the session, check the item and evidence, then record the
                  decision before the item changes hands.
                </p>
                <Button
                  type="button"
                  onClick={() => router.push("/guard/scan")}
                  className="mt-4 w-full bg-white text-[#1D2981] hover:bg-slate-100"
                >
                  Open Scan
                </Button>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10 font-extrabold text-[#1D2981]">
                    1
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900">Validate</p>
                    <p className="mt-1 leading-6">
                      Confirm the QR session is still active and tied to the student&apos;s
                      handover attempt.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10 font-extrabold text-[#1D2981]">
                    2
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900">Review</p>
                    <p className="mt-1 leading-6">
                      Check the item details, the evidence image, and the selected guard
                      post before acting.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10 text-[#1D2981]">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900">Decide</p>
                    <p className="mt-1 leading-6">
                      Accept to take custody or reject to keep the item with the student
                      and close that attempt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GuardSurfaceCard>

          <GuardSurfaceCard
            title="Current Session"
            subtitle="Resume an active review or confirm the last recorded decision."
          >
            <GuardSessionSummary
              activeSession={activeSession}
              latestDecision={latestDecision}
            />

            <div className="mt-4 space-y-3">
              {activeSession ? (
                <Button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/guard/scan/review/${activeSession.scan.custody_attempt_id}`
                    )
                  }
                  className="w-full bg-[#1D2981] text-white hover:bg-[#17216b]"
                >
                  Continue Review
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => router.push("/guard/scan")}
                  className="w-full bg-[#1D2981] text-white hover:bg-[#17216b]"
                >
                  Start New Review
                </Button>
              )}

              {latestDecision ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDismissDecision}
                  className="w-full"
                >
                  Dismiss Latest Result
                </Button>
              ) : null}
            </div>
          </GuardSurfaceCard>
        </div>
      </div>
    </section>
  );
}
