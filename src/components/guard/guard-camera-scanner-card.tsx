"use client";

import { Camera, LoaderCircle, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuardQrScanner } from "@/hooks/use-guard-qr-scanner";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";
import type { GuardQrPayload } from "@/types/guard-custody";

interface GuardCameraScannerCardProps {
  isSubmitting: boolean;
  onScan: (payload: GuardQrPayload) => Promise<void>;
}

export function GuardCameraScannerCard({
  isSubmitting,
  onScan,
}: GuardCameraScannerCardProps) {
  const { closeCamera, isSupported, openCamera, state, videoRef } = useGuardQrScanner({
    onDetected: onScan,
  });

  return (
    <GuardSurfaceCard
      title="Scan with Camera"
      subtitle="Point the camera at the student's QR code to open the review."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#1D2981]/10 bg-[#1D2981]/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1D2981]">
            <QrCode className="size-4" />
            <span>Scan the QR code to open the review automatically.</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{state.message}</p>
        </div>

        <div className="mx-auto w-full max-w-[22rem]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-sm">
            {state.isOpen ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="h-72 w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8">
                  <div className="h-44 w-full max-w-[15rem] rounded-[1.75rem] border-2 border-white/90 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]" />
                </div>
              </>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-white/90">
                <Camera className="size-9" />
                <p className="text-base font-semibold">Camera preview appears here.</p>
                <p className="text-sm leading-6 text-white/75">
                  Keep the student QR inside the frame until the review screen opens.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {state.isOpen ? (
            <Button
              type="button"
              variant="outline"
              onClick={closeCamera}
              disabled={isSubmitting}
              className="w-full border-[#1D2981] text-[#1D2981] hover:bg-[#1D2981]/5"
            >
              <X className="size-4" />
              Close Camera
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void openCamera()}
              disabled={isSubmitting}
              className="w-full bg-[#1D2981] text-white hover:bg-[#17216b]"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Loading Review
                </>
              ) : (
                <>
                  <Camera className="size-4" />
                  Open Camera
                </>
              )}
            </Button>
          )}

          <p className="text-sm leading-6 text-slate-600">
            {isSupported
              ? "If the camera cannot scan the code, use manual entry below."
              : "If this browser cannot scan QR codes, use manual entry below."}
          </p>
        </div>
      </div>
    </GuardSurfaceCard>
  );
}
