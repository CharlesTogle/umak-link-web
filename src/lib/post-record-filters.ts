import type { PostRecordFilters } from "@/types/post-record";

type SearchParamsReader = {
  get: (key: string) => string | null;
};

export type PostRecordsSidebarFilter =
  | "all"
  | "claimed"
  | "unclaimed"
  | "lost"
  | "pending"
  | "archived";

export const DEFAULT_POST_RECORD_FILTERS: PostRecordFilters = {
  postStatus: "all",
  itemStatus: "all",
  itemType: "all",
};

function normalizePostStatus(value: string | null): PostRecordFilters["postStatus"] | null {
  if (!value) return null;

  switch (value.toLowerCase()) {
    case "all":
      return "all";
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "reported":
      return "Reported";
    case "archived":
      return "Archived";
    case "fraud":
      return "Fraud";
    case "deleted":
      return "Deleted";
    default:
      return null;
  }
}

function normalizeItemStatus(value: string | null): PostRecordFilters["itemStatus"] | null {
  if (!value) return null;

  switch (value.toLowerCase()) {
    case "all":
      return "all";
    case "claimed":
      return "Claimed";
    case "unclaimed":
      return "Unclaimed";
    case "lost":
      return "Lost";
    case "returned":
      return "Returned";
    default:
      return null;
  }
}

function normalizeItemType(value: string | null): PostRecordFilters["itemType"] | null {
  if (!value) return null;

  switch (value.toLowerCase()) {
    case "all":
      return "all";
    case "missing":
      return "missing";
    case "found":
      return "found";
    default:
      return null;
  }
}

function getLegacySidebarFilters(filter: string | null): Partial<PostRecordFilters> {
  if (!filter) return {};

  switch (filter.toLowerCase()) {
    case "pending":
      return { postStatus: "Pending" };
    case "claimed":
      return { itemStatus: "Claimed" };
    case "unclaimed":
      return { itemStatus: "Unclaimed" };
    case "lost":
      return { itemStatus: "Lost" };
    case "archived":
      return { postStatus: "Archived" };
    default:
      return {};
  }
}

export function getPostRecordFiltersFromSearchParams(searchParams: SearchParamsReader): PostRecordFilters {
  const legacyFilters = getLegacySidebarFilters(searchParams.get("filter"));

  return {
    postStatus: normalizePostStatus(searchParams.get("postStatus")) ?? legacyFilters.postStatus ?? "all",
    itemStatus: normalizeItemStatus(searchParams.get("itemStatus")) ?? legacyFilters.itemStatus ?? "all",
    itemType: normalizeItemType(searchParams.get("itemType")) ?? legacyFilters.itemType ?? "all",
  };
}

export function buildPostRecordsUrl(filters: Partial<PostRecordFilters> = {}): string {
  const nextFilters = { ...DEFAULT_POST_RECORD_FILTERS, ...filters };
  const params = new URLSearchParams();

  if (nextFilters.postStatus !== "all") {
    params.set("postStatus", nextFilters.postStatus);
  }
  if (nextFilters.itemStatus !== "all") {
    params.set("itemStatus", nextFilters.itemStatus);
  }
  if (nextFilters.itemType !== "all") {
    params.set("itemType", nextFilters.itemType);
  }

  const query = params.toString();
  return query ? `/staff/post-records?${query}` : "/staff/post-records";
}

export function buildPostRecordsSidebarHref(filter: PostRecordsSidebarFilter): string {
  switch (filter) {
    case "claimed":
      return buildPostRecordsUrl({ itemStatus: "Claimed" });
    case "unclaimed":
      return buildPostRecordsUrl({ itemStatus: "Unclaimed" });
    case "lost":
      return buildPostRecordsUrl({ itemStatus: "Lost" });
    case "pending":
      return buildPostRecordsUrl({ postStatus: "Pending" });
    case "archived":
      return buildPostRecordsUrl({ postStatus: "Archived" });
    default:
      return buildPostRecordsUrl();
  }
}
