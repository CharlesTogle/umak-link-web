import Image from "next/image";
import { BadgeCheck, CircleUserRound } from "lucide-react";
import type { ClaimVerifiedClaimerSummary } from "@/types/claim-verification";

interface VerifiedClaimerCardProps {
  claimer: ClaimVerifiedClaimerSummary;
  isSelected: boolean;
  onToggleSelection?: () => void;
}

export function VerifiedClaimerCard({
  claimer,
  isSelected,
  onToggleSelection,
}: VerifiedClaimerCardProps) {
  return (
    <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <BadgeCheck className="size-4" />
          Verified Claimer
        </div>
        {onToggleSelection ? (
          <button
            type="button"
            onClick={onToggleSelection}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              isSelected
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {isSelected ? "Using QR Identity" : "Use QR Identity"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-white text-slate-500">
          {claimer.profile_picture_url ? (
            <Image
              src={claimer.profile_picture_url}
              alt={claimer.user_name}
              width={48}
              height={48}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <CircleUserRound className="size-6" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {claimer.user_name}
          </p>
          <p className="truncate text-xs text-slate-600">{claimer.email}</p>
          <p className="truncate text-xs text-slate-500">User ID: {claimer.user_id}</p>
        </div>
      </div>
    </article>
  );
}
