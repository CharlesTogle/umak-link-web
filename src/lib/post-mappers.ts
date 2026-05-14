import { parseTimestamp } from "@/lib/date-time-helpers";
import type { CompactPost } from "@/types/compact-post";
import type { PostRecord } from "@/types/post-record";
import type { ApiPostRecord } from "@/types/post-record-api";

function toTitleCase(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPostStatus(value: string | null | undefined): string {
  if (!value) return "Pending";
  return toTitleCase(value);
}

function formatItemStatus(value: string | null | undefined): string {
  if (!value) return "Unclaimed";
  return toTitleCase(value);
}

function hoursAgoFrom(value: string | null): number {
  if (!value) return 0;
  const date = parseTimestamp(value);
  if (!date) return 0;
  const diffMs = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

export function mapPostToCompact(post: ApiPostRecord): CompactPost {
  return {
    postId: String(post.post_id),
    posterId: post.poster_id ?? null,
    itemId: post.item_id ?? null,
    hoursAgo: hoursAgoFrom(post.submission_date),
    username: post.poster_name ?? "Unknown User",
    isAnonymous: post.is_anonymous,
    posterProfileUrl: post.poster_profile_picture_url ?? null,
    title: post.item_name ?? "Untitled item",
    imageUrl: post.item_image_url ?? null,
    itemName: post.item_name ?? "Untitled item",
    itemDescription: post.item_description ?? null,
    category: post.category ?? null,
    itemType: post.item_type === "missing" ? "lost" : "found",
    postStatus: formatPostStatus(post.post_status) as CompactPost["postStatus"],
    itemStatus: formatItemStatus(post.item_status) as CompactPost["itemStatus"],
    custodyStatus: post.custody_status ?? null,
    lastSeenLocation: post.last_seen_location ?? null,
    lastSeenAt: post.last_seen_at ?? null,
    submissionDate: post.submission_date ?? null,
  };
}

export function mapPostToRecord(post: ApiPostRecord): PostRecord {
  return {
    postId: String(post.post_id),
    posterId: post.poster_id ?? null,
    posterProfileUrl: post.poster_profile_picture_url ?? null,
    itemId: post.item_id ?? null,
    hoursAgo: hoursAgoFrom(post.submission_date),
    username: post.poster_name ?? "Unknown User",
    isAnonymous: post.is_anonymous,
    title: post.item_name ?? "Untitled item",
    imageUrl: post.item_image_url ?? null,
    itemName: post.item_name ?? "Untitled item",
    itemDescription: post.item_description ?? null,
    category: post.category ?? null,
    itemType: post.item_type,
    postStatus: formatPostStatus(post.post_status) as PostRecord["postStatus"],
    itemStatus: formatItemStatus(post.item_status) as PostRecord["itemStatus"],
    custodyStatus: post.custody_status ?? null,
    lastSeenLocation: post.last_seen_location ?? null,
    lastSeenAt: post.last_seen_at ?? null,
    submissionDate: post.submission_date ?? null,
  };
}
