"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostRecordCard } from "@/components/staff/post-record-card";
import { CustomToast } from "@/components/ui/custom-toast";
import { useStaffPostRecordsStore } from "@/stores/staff-post-records-store";
import { sendNotification } from "@/services/notifications-service";
import type {
  PostRecord,
  PostRecordAction,
  PostRecordFilterKey,
  PostRecordFilters,
  PostRecordSortDirection,
} from "@/types/post-record";

const filterGroups: Array<{
  key: PostRecordFilterKey;
  label: string;
  options: Array<{ label: string; value: PostRecordFilters[PostRecordFilterKey] }>;
}> = [
  {
    key: "postStatus",
    label: "Post Status",
    options: [
      { label: "All", value: "all" },
      { label: "Pending", value: "Pending" },
      { label: "Accepted", value: "Accepted" },
      { label: "Rejected", value: "Rejected" },
    ],
  },
  {
    key: "itemStatus",
    label: "Item Status",
    options: [
      { label: "All", value: "all" },
      { label: "Claimed", value: "Claimed" },
      { label: "Unclaimed", value: "Unclaimed" },
      { label: "Lost", value: "Lost" },
      { label: "Returned", value: "Returned" },
    ],
  },
  {
    key: "itemType",
    label: "Item Type",
    options: [
      { label: "All", value: "all" },
      { label: "Missing", value: "missing" },
      { label: "Found", value: "found" },
    ],
  },
];

const sortOptions: Array<{ label: string; value: PostRecordSortDirection }> = [
  { label: "Latest Upload (Desc)", value: "desc" },
  { label: "Oldest Upload (Asc)", value: "asc" },
];

export function PostRecordsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { records, isLoading, isRefreshing, error, hasMore, fetchRecords, loadMore, refresh } =
    useStaffPostRecordsStore();

  const getFiltersFromUrl = (): PostRecordFilters => {
    const postStatus = searchParams.get("postStatus") as PostRecordFilters["postStatus"] | null;
    const itemStatus = searchParams.get("itemStatus") as PostRecordFilters["itemStatus"] | null;
    const itemType = searchParams.get("itemType") as PostRecordFilters["itemType"] | null;

    return {
      postStatus: postStatus ?? "all",
      itemStatus: itemStatus ?? "all",
      itemType: itemType ?? "all",
    };
  };

  const filters = getFiltersFromUrl();
  const [sortDir, setSortDir] = useState<PostRecordSortDirection>("desc");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [pendingNotifyRecord, setPendingNotifyRecord] = useState<PostRecord | null>(null);
  const lastNotifyTimeRef = useRef<Map<string, number>>(new Map());
  const feedRef = useRef<HTMLDivElement | null>(null);

  const updateFilters = (key: PostRecordFilterKey, value: PostRecordFilters[PostRecordFilterKey]) => {
    const newFilters = { ...filters, [key]: value };
    const params = new URLSearchParams();

    // Save each filter independently
    if (newFilters.postStatus !== "all") {
      params.set("postStatus", newFilters.postStatus);
    }
    if (newFilters.itemStatus !== "all") {
      params.set("itemStatus", newFilters.itemStatus);
    }
    if (newFilters.itemType !== "all") {
      params.set("itemType", newFilters.itemType);
    }

    router.push(`/staff/post-records?${params.toString()}`);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Backend handles all filtering and sorting, so we can use records directly
  const filteredRecords = records;

  useEffect(() => {
    fetchRecords({
      ...(filters.itemType !== "all" ? { itemType: filters.itemType } : {}),
      postStatus: filters.postStatus === "all" ? null : filters.postStatus.toLowerCase(),
      itemStatus: filters.itemStatus === "all" ? null : filters.itemStatus.toLowerCase(),
      sortDirection: sortDir,
      pageSize: 10,
    });
  }, [fetchRecords, filters.itemType, filters.postStatus, filters.itemStatus, sortDir]);

  const handleRefresh = () => {
    refresh();
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!hasMore) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      loadMore();
    }
  };

  const handleAction = (action: PostRecordAction, record: PostRecord) => {
    if (action === "view") {
      router.push(`/staff/post-record/view/${record.postId}`);
      return;
    }

    if (action === "change-status") {
      router.push(`/staff/post-record/view/${record.postId}`);
      return;
    }

    if (action === "claim") {
      router.push(`/staff/post/claim/${record.postId}`);
      return;
    }

    if (action === "share") {
      const shareUrl = `${window.location.origin}/staff/post-record/view/${record.postId}`;
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => setToast({ message: "Link copied to clipboard", tone: "success" }))
        .catch(() => setToast({ message: "Failed to share post", tone: "danger" }));
      return;
    }

    if (action === "copy-item-id") {
      if (!record.itemId) {
        setToast({ message: "Item ID is not available", tone: "danger" });
        return;
      }

      navigator.clipboard
        .writeText(record.itemId)
        .then(() => setToast({ message: "Item ID copied to clipboard", tone: "success" }))
        .catch(() => setToast({ message: "Failed to copy Item ID", tone: "danger" }));
      return;
    }

    if (action === "notify") {
      if (!record.posterId) {
        setToast({ message: "Owner is not available for notification", tone: "danger" });
        return;
      }

      const currentTime = Date.now();
      const lastNotifyTime = lastNotifyTimeRef.current.get(record.postId) ?? 0;
      const timeSince = currentTime - lastNotifyTime;

      if (timeSince < 10000) {
        const remainingSeconds = Math.ceil((10000 - timeSince) / 1000);
        setToast({
          message: `Please wait ${remainingSeconds} seconds before notifying again`,
          tone: "danger",
        });
        return;
      }

      setPendingNotifyRecord(record);
    }
  };

  const handleConfirmNotify = () => {
    if (!pendingNotifyRecord) return;
    const record = pendingNotifyRecord;
    sendNotification({
      user_id: record.posterId ?? "",
      title: "Great News! A Possible Match to Your Item",
      body: `We found items that may match your ${record.itemName}. Please proceed to the Security Office during office hours to verify.`,
      description: "Please proceed to the Security Office during office hours.",
      type: "match",
      data: { postId: record.postId, itemId: record.itemId },
      ...(record.imageUrl ? { image_url: record.imageUrl } : {}),
    })
      .then(() => {
        lastNotifyTimeRef.current.set(record.postId, Date.now());
        setToast({ message: "Owner notified successfully", tone: "success" });
      })
      .catch(() => {
        setToast({ message: "Failed to notify owner", tone: "danger" });
      })
      .finally(() => {
        setPendingNotifyRecord(null);
      });
  };

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Post Records</h1>
          <p className="mt-1 text-sm text-slate-600">Review, filter, and manage submitted posts.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading && filteredRecords.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`records-loading-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {filteredRecords.length === 0 && !isLoading ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No posts match the selected filters.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <PostRecordCard key={record.postId} record={record} onAction={handleAction} />
            ))}
          </div>
        )}
        {!hasMore && filteredRecords.length > 0 ? (
          <p className="text-center text-sm text-slate-500">You&apos;re all caught up!</p>
        ) : null}
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[#1D2981]">Search</p>
          <button
            type="button"
            onClick={() => router.push("/staff/search")}
            className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm hover:border-slate-300"
          >
            <Search className="size-4 text-slate-400" />
            Search records
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[#1D2981]">Refresh</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <RefreshCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh records"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#1D2981]">Filters & Sorting</p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Sort:</span>
              <select
                value={sortDir}
                onChange={(event) => setSortDir(event.target.value as PostRecordSortDirection)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filterGroups.map((group) => (
              <section key={group.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isActive = filters[group.key] === option.value;
                    return (
                      <button
                        key={`${group.key}-${option.value}`}
                        type="button"
                        onClick={() => updateFilters(group.key, option.value)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          isActive
                            ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </aside>

      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}

      {pendingNotifyRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Notify Owner</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to notify the owner that similar items are in the security office?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingNotifyRecord(null)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNotify}
                className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
