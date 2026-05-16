"use client";

import Image from "next/image";
import { ChevronRight, ClipboardCheck, MapPin, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { GuardPageSectionHeader } from "@/components/guard/guard-page-section-header";
import { GuardSurfaceCard } from "@/components/guard/guard-surface-card";
import { useGuardActiveClaimReviewsQuery } from "@/hooks/queries/claim-verification-queries";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";

export function GuardActiveClaimReviewsView() {
  const router = useRouter();
  const reviewsQuery = useGuardActiveClaimReviewsQuery();
  const posts = reviewsQuery.data?.posts ?? [];

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-4">
      <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <GuardPageSectionHeader
          title="Active Reviews"
          subtitle="Found items still with the current guard and eligible for QR-gated claim processing."
          icon={ClipboardCheck}
        />

        <div className="space-y-4 bg-[#f6fafc] p-5">
          <GuardSurfaceCard
            title="Claim Queue"
            subtitle="Open the live guard claim page for an item that is still in your custody review queue."
          >
            {reviewsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`guard-active-review-skeleton-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-4 w-64 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : null}

            {reviewsQuery.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {reviewsQuery.error.message}
              </div>
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.error && posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No active guard claim reviews are available right now.
              </div>
            ) : null}

            <div className="space-y-3">
              {posts.map((post) => (
                <button
                  key={post.post_id}
                  type="button"
                  onClick={() =>
                    router.push(`/guard/post-record/view/${post.post_id}`)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#1D2981]/30 hover:bg-white"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200 bg-white md:h-28 md:w-36">
                      {post.item_image_url ? (
                        <Image
                          src={post.item_image_url}
                          alt={post.item_name ?? "Claim review item"}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="144px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {post.item_name ?? "Untitled item"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {post.item_description ?? "No description provided."}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 hidden size-5 shrink-0 text-slate-400 md:block" />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                          {post.custody_status ?? "with_guard"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                          {post.category ?? "No category"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p className="inline-flex items-center gap-2">
                          <MapPin className="size-4 text-slate-400" />
                          {post.last_seen_location ?? "Unknown location"}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <PackageCheck className="size-4 text-slate-400" />
                          {formatDateTimeInPhilippineTime(
                            post.submitted_on_date_local,
                            "Unknown"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </GuardSurfaceCard>
        </div>
      </div>
    </section>
  );
}
