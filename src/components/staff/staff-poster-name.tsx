"use client";

import { cn } from "@/lib/utils";

const FALLBACK_POSTER_NAME = "Unknown User";

export function StaffPosterName({
  name,
  isAnonymous,
  className,
  nameClassName,
  badgeClassName,
}: {
  name: string | null | undefined;
  isAnonymous: boolean;
  className?: string;
  nameClassName?: string;
  badgeClassName?: string;
}) {
  const displayName = name?.trim() ? name : FALLBACK_POSTER_NAME;

  return (
    <span className={cn("inline-flex max-w-full items-center gap-2", className)}>
      <span className={cn("min-w-0 truncate", nameClassName)}>{displayName}</span>
      {isAnonymous ? (
        <span
          className={cn(
            "shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500",
            badgeClassName
          )}
        >
          Anonymous
        </span>
      ) : null}
    </span>
  );
}
