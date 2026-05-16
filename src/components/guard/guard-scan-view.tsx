"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { GuardCameraScannerCard } from "@/components/guard/guard-camera-scanner-card";
import { GuardManualEntryForm } from "@/components/guard/guard-manual-entry-form";
import { GuardPageSectionHeader } from "@/components/guard/guard-page-section-header";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";
import { CustomToast, type CustomToastTone } from "@/components/ui/custom-toast";
import { Button } from "@/components/ui/button";
import { useGuardScanMutation } from "@/hooks/mutations/guard-custody-mutations";
import {
  clearActiveGuardScanSession,
  readActiveGuardScanSession,
  storeActiveGuardScanSession,
} from "@/lib/guard-session-storage";
import type {
  GuardScanPayload,
  StoredGuardScanSession,
} from "@/types/guard-custody";

interface GuardToastState {
  message: string;
  tone: CustomToastTone;
}

export function GuardScanView() {
  const router = useRouter();
  const [toast, setToast] = useState<GuardToastState | null>(null);
  const [activeSession, setActiveSession] = useState<StoredGuardScanSession | null>(
    () => readActiveGuardScanSession()
  );
  const guardScanMutation = useGuardScanMutation();

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  const loadReview = async (payload: GuardScanPayload) => {
    const scan = await guardScanMutation.mutateAsync(payload);
    const storedSession = storeActiveGuardScanSession(scan);
    setActiveSession(storedSession);
    router.push(`/guard/scan/review/${scan.custody_attempt_id}`);
  };

  const handleLoadReview = async (payload: GuardScanPayload) => {
    try {
      await loadReview(payload);
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to load the custody review.",
        tone: "danger",
      });
    }
  };

  const handleClearSavedSession = () => {
    clearActiveGuardScanSession();
    setActiveSession(null);
    setToast({
      message: "Saved guard review cleared.",
      tone: "success",
    });
  };

  return (
    <>
      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
      <section className="grid h-full min-h-0 grid-cols-1 gap-4">
        <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <GuardPageSectionHeader
            title="Scan Handover"
            subtitle="Scan the student QR or use manual entry to open the review."
            icon={QrCode}
          />
          <div className="space-y-4 bg-[#f6fafc] p-5">
            <GuardSurfaceCard
              title="Before You Scan"
              subtitle="Keep the item with the student until you accept the handover in the app."
            >
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-6">
                  Ask the student to show the custody QR on their phone. Scan it here to
                  open the handover review.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-6">
                  Check the item and the handover photo first. Only take the item after
                  you record an accepted decision.
                </div>
              </div>
            </GuardSurfaceCard>

            {activeSession ? (
              <GuardSurfaceCard
                title="Saved Review"
                subtitle="A guard review is already stored in this browser."
              >
                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Item:</span>{" "}
                    {activeSession.scan.item_name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Guard post:</span>{" "}
                    {activeSession.scan.guard_post_name || "Unassigned"}
                  </p>
                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/guard/scan/review/${activeSession.scan.custody_attempt_id}`
                        )
                      }
                      className="w-full bg-[#1D2981] text-white hover:bg-[#17216b]"
                    >
                      Continue Saved Review
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearSavedSession}
                      className="w-full"
                    >
                      Clear Saved Review
                    </Button>
                  </div>
                </div>
              </GuardSurfaceCard>
            ) : null}

            <GuardCameraScannerCard
              isSubmitting={guardScanMutation.isPending}
              onScan={handleLoadReview}
            />

            <GuardSurfaceCard
              title="Manual Entry"
              subtitle="Use this only if the camera cannot read the student QR."
            >
              <GuardManualEntryForm
                isSubmitting={guardScanMutation.isPending}
                onSubmit={handleLoadReview}
              />
            </GuardSurfaceCard>
          </div>
        </div>
      </section>
    </>
  );
}
