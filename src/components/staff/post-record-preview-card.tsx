"use client";

import Image from "next/image";
import { ShieldAlert } from "lucide-react";
import { PhotoView } from "react-photo-view";
import { cn } from "@/lib/utils";

export interface PostRecordPreviewData {
  item_name: string | null;
  item_description: string | null;
  item_image_url: string | null;
  is_anonymous: boolean;
  poster_name: string | null;
}

interface PostRecordPreviewCardProps {
  sectionLabel: string;
  post: PostRecordPreviewData;
  actionLabel?: string;
  className?: string;
  onAction?: () => void;
}

export function PostRecordPreviewCard({
  sectionLabel,
  post,
  actionLabel,
  className,
  onAction,
}: PostRecordPreviewCardProps) {
  const posterLabel = post.is_anonymous
    ? "Anonymous"
    : post.poster_name || "Unknown User";

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50 p-3", className)}>
      <p className="mb-2 text-sm font-semibold text-[#1D2981]">{sectionLabel}</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-[13/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:h-36 sm:w-52 sm:flex-shrink-0">
          {post.item_image_url ? (
            <PhotoView src={post.item_image_url}>
              <div className="relative h-full w-full cursor-zoom-in">
                <Image
                  src={post.item_image_url}
                  alt={post.item_name ?? "Post item"}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 208px"
                />
              </div>
            </PhotoView>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-sm text-slate-600">
          <p className="text-lg font-semibold text-slate-900">
            {post.item_name ?? "Unknown Item"}
          </p>
          <p className="mt-1 line-clamp-5">{post.item_description ?? "No description provided."}</p>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Poster:</span> {posterLabel}
          </p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <ShieldAlert className="size-3.5" /> {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
