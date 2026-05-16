import { Button } from "@/components/ui/button";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";

interface GuardReviewMissingStateProps {
  onOpenScan: () => void;
  onReturnHome: () => void;
}

export function GuardReviewMissingState({
  onOpenScan,
  onReturnHome,
}: GuardReviewMissingStateProps) {
  return (
    <GuardSurfaceCard
      title="No Saved Review Found"
      subtitle="Open the scan screen and load a handover review before trying to access this page."
    >
      <div className="space-y-3">
        <Button
          type="button"
          onClick={onOpenScan}
          className="w-full bg-[#1D2981] text-white hover:bg-[#17216b]"
        >
          Go to Scan Screen
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReturnHome}
          className="w-full"
        >
          Return Home
        </Button>
      </div>
    </GuardSurfaceCard>
  );
}
