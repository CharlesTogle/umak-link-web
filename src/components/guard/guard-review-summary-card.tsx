import Image from "next/image";
import { PhotoView } from "react-photo-view";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";
import type { GuardScanResponse } from "@/types/guard-custody";

interface GuardReviewSummaryCardProps {
  scan: GuardScanResponse;
}

interface GuardReviewImagePanelProps {
  title: string;
  imageAlt: string;
  imageUrl: string | null;
  emptyState: string;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

function GuardReviewImagePanel({
  title,
  imageAlt,
  imageUrl,
  emptyState,
}: GuardReviewImagePanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-3">
        {imageUrl ? (
          <PhotoView src={imageUrl}>
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={960}
              height={416}
              unoptimized
              className="h-52 w-full cursor-zoom-in rounded-2xl object-cover"
            />
          </PhotoView>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            {emptyState}
          </div>
        )}
      </div>
    </div>
  );
}

export function GuardReviewSummaryCard({
  scan,
}: GuardReviewSummaryCardProps) {
  return (
    <GuardSurfaceCard
      title={scan.item_name}
      subtitle="Guard-facing review of the student handover session."
    >
      <div className="space-y-4">
        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Guard Post
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {scan.guard_post_name || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Attempt
            </p>
            <p className="mt-2 font-semibold text-slate-900">#{scan.attempt_number}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Last Seen
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {scan.last_seen_location || "Not available"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(scan.last_seen_at)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Reported
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {formatDateTime(scan.submission_date)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {scan.item_description || "No description provided."}
          </p>
        </div>

        <div className="space-y-4">
          <GuardReviewImagePanel
            title="Item Photo"
            imageAlt={`${scan.item_name} item photo`}
            imageUrl={scan.item_image_url}
            emptyState="No item image uploaded."
          />
          <GuardReviewImagePanel
            title="Handover Evidence"
            imageAlt="Student handover evidence"
            imageUrl={scan.handover_image_url}
            emptyState="No handover image available."
          />
        </div>
      </div>
    </GuardSurfaceCard>
  );
}
