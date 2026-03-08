"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCcw, WifiOff, AlertTriangle, Inbox, RotateCw, Filter } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { PostRecordCard } from "@/components/staff/post-record-card";
import { CustomToast } from "@/components/ui/custom-toast";
import { sendNotification } from "@/services/notifications-service";
import { generateReverseImageQuery } from "@/services/search-service";
import { useStaffSearchStore } from "@/stores/staff-search-store";
import type { PostRecord, PostRecordAction } from "@/types/post-record";
import type { SearchItemStatus, SearchPostStatus } from "@/types/search";

interface StaffSearchViewProps {
  autoSearchFromUrl?: boolean;
}

const itemStatusOptions: Array<{ label: string; value: SearchItemStatus }> = [
  { label: "Lost", value: "lost" },
  { label: "Unclaimed", value: "unclaimed" },
  { label: "Claimed", value: "claimed" },
  { label: "Returned", value: "returned" },
  { label: "Discarded", value: "discarded" },
];

const postStatusOptions: Array<{ label: string; value: SearchPostStatus }> = [
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Claimed", value: "claimed" },
  { label: "Returned", value: "returned" },
];

function chipClass(isActive: boolean): string {
  return isActive
    ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function StaffSearchView({ autoSearchFromUrl = false }: StaffSearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSearchedQueryRef = useRef<string>("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const {
    query,
    filters,
    results,
    isLoading,
    hasSearched,
    error,
    isOffline,
    setQuery,
    setFilters,
    toggleItemStatus,
    togglePostStatus,
    setOffline,
    runSearch,
    clearSearch,
  } = useStaffSearchStore(
    useShallow((state) => ({
      query: state.query,
      filters: state.filters,
      results: state.results,
      isLoading: state.isLoading,
      hasSearched: state.hasSearched,
      error: state.error,
      isOffline: state.isOffline,
      setQuery: state.setQuery,
      setFilters: state.setFilters,
      toggleItemStatus: state.toggleItemStatus,
      togglePostStatus: state.togglePostStatus,
      setOffline: state.setOffline,
      runSearch: state.runSearch,
      clearSearch: state.clearSearch,
    }))
  );

  const urlQuery = (searchParams.get("q") ?? "").trim();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const syncNetworkState = () => {
      setOffline(!window.navigator.onLine);
    };

    syncNetworkState();
    window.addEventListener("online", syncNetworkState);
    window.addEventListener("offline", syncNetworkState);

    return () => {
      window.removeEventListener("online", syncNetworkState);
      window.removeEventListener("offline", syncNetworkState);
    };
  }, [setOffline]);

  useEffect(() => {
    if (!autoSearchFromUrl || !urlQuery) return;
    if (autoSearchedQueryRef.current === urlQuery) return;

    autoSearchedQueryRef.current = urlQuery;
    setQuery(urlQuery);
    void runSearch(urlQuery);
  }, [autoSearchFromUrl, runSearch, setQuery, urlQuery]);

  const runSearchFromForm = async () => {
    const trimmed = query.trim();
    let effectiveQuery = trimmed;

    if (!trimmed && !selectedImage) {
      setToast({ message: "Enter a keyword or upload an image first.", tone: "danger" });
      return;
    }

    if (selectedImage) {
      setIsAnalyzingImage(true);
      try {
        const imageDataUrl = await fileToDataUrl(selectedImage);
        const imageResult = await generateReverseImageQuery({
          imageDataUrl,
          ...(trimmed ? { searchValue: trimmed } : {}),
        });

        if (!imageResult.success) {
          setToast({
            message: imageResult.message ?? "Image analysis failed. Please try again.",
            tone: "danger",
          });
          return;
        }

        effectiveQuery = imageResult.search_query.trim();
      } catch {
        setToast({
          message: "Failed to analyze the uploaded image. Please try again.",
          tone: "danger",
        });
        return;
      } finally {
        setIsAnalyzingImage(false);
      }
    }

    if (!effectiveQuery) {
      setToast({
        message: "No search keyword was generated from the image.",
        tone: "danger",
      });
      return;
    }

    if (autoSearchFromUrl) {
      const nextPath = `/staff/search/results?q=${encodeURIComponent(effectiveQuery)}`;
      router.replace(nextPath);
      setQuery(effectiveQuery);
      void runSearch(effectiveQuery);
      return;
    }

    router.push(`/staff/search/results?q=${encodeURIComponent(effectiveQuery)}`);
  };

  const handleClear = () => {
    clearSearch();
    setSelectedImage(null);
    setIsAnalyzingImage(false);
    autoSearchedQueryRef.current = "";
    if (autoSearchFromUrl) {
      router.replace("/staff/search/results");
    }
  };

  const handleRetry = () => {
    void runSearch();
  };

  const handleAction = (action: PostRecordAction, record: PostRecord) => {
    if (action === "view" || action === "change-status") {
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
        .catch(() => setToast({ message: "Failed to copy link", tone: "danger" }));
      return;
    }

    if (action === "copy-item-id") {
      if (!record.itemId) {
        setToast({ message: "Item ID is not available", tone: "danger" });
        return;
      }

      navigator.clipboard
        .writeText(record.itemId)
        .then(() => setToast({ message: "Item ID copied", tone: "success" }))
        .catch(() => setToast({ message: "Failed to copy Item ID", tone: "danger" }));
      return;
    }

    if (!record.posterId) {
      setToast({ message: "Owner is not available for notification", tone: "danger" });
      return;
    }

    sendNotification({
      user_id: record.posterId,
      title: "Great News! A Possible Match to Your Item",
      body: `We found items that may match your ${record.itemName}. Please proceed to the Security Office during office hours to verify.`,
      description: "Please proceed to the Security Office during office hours.",
      type: "match",
      data: { postId: record.postId, itemId: record.itemId },
      ...(record.imageUrl ? { image_url: record.imageUrl } : {}),
    })
      .then(() => setToast({ message: "Owner notified successfully", tone: "success" }))
      .catch(() => setToast({ message: "Failed to notify owner", tone: "danger" }));
  };

  const showReadyState =
    (!autoSearchFromUrl || !query.trim()) &&
    !isLoading &&
    !error &&
    !isOffline &&
    results.length === 0;
  const showEmptyResults =
    autoSearchFromUrl &&
    hasSearched &&
    Boolean(query.trim()) &&
    !isLoading &&
    !error &&
    !isOffline &&
    results.length === 0;

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Search</h1>
          <p className="mt-1 text-sm text-slate-600">Find post records using keyword + advanced filters.</p>
          {autoSearchFromUrl && query ? (
            <p className="mt-2 text-sm text-slate-600">
              Showing results for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>
            </p>
          ) : null}
        </div>

        {isOffline ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-800">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <WifiOff className="size-4" /> No internet connection
            </div>
            <p className="mt-2 text-sm">Reconnect to the internet to run search and load results.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm hover:bg-amber-100"
            >
              <RotateCw className="size-4" /> Retry
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4" /> Search failed
            </div>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm hover:bg-rose-100"
            >
              <RefreshCcw className="size-4" /> Retry search
            </button>
          </div>
        ) : null}

        {showReadyState ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Enter a keyword, apply filters, then click <span className="font-semibold">Search records</span>.
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`search-loading-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {showEmptyResults ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            <div className="mx-auto mb-2 inline-flex size-8 items-center justify-center rounded-full bg-slate-100">
              <Inbox className="size-4 text-slate-500" />
            </div>
            No records matched your search. Try broader keywords or remove some filters.
          </div>
        ) : null}

        {!isLoading && !error && !isOffline && results.length > 0 ? (
          <div className="space-y-4">
            {results.map((record) => (
              <PostRecordCard key={record.postId} record={record} onAction={handleAction} />
            ))}
          </div>
        ) : null}
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
        <form
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearchFromForm();
          }}
        >
          <p className="mb-1 text-sm font-semibold text-[#1D2981]">Search Query</p>
          <label className="sr-only" htmlFor="staff-search-keyword">
            Search keyword
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="staff-search-keyword"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. black wallet, ID lace"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reverse Image Search
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            {selectedImage ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <span className="truncate">{selectedImage.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Filter className="size-3.5" /> Filters
            </p>
            <div className="space-y-2">
              <input
                value={filters.category}
                onChange={(event) => setFilters({ category: event.target.value })}
                placeholder="Category"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
              <input
                value={filters.locationLastSeen}
                onChange={(event) => setFilters({ locationLastSeen: event.target.value })}
                placeholder="Last seen location"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
              <input
                type="date"
                value={filters.lastSeenDate}
                onChange={(event) => setFilters({ lastSeenDate: event.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.claimFromDate}
                  onChange={(event) => setFilters({ claimFromDate: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
                <input
                  type="date"
                  value={filters.claimToDate}
                  onChange={(event) => setFilters({ claimToDate: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Item Status</p>
            <div className="flex flex-wrap gap-2">
              {itemStatusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggleItemStatus(status.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${chipClass(
                    filters.itemStatuses.includes(status.value)
                  )}`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Post Status</p>
            <div className="flex flex-wrap gap-2">
              {postStatusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => togglePostStatus(status.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${chipClass(
                    filters.postStatuses.includes(status.value)
                  )}`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.sort}
              onChange={(event) => setFilters({ sort: event.target.value as "accepted_on_date" | "submission_date" })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="submission_date">Sort by Submission</option>
              <option value="accepted_on_date">Sort by Accepted Date</option>
            </select>
            <select
              value={filters.sortDirection}
              onChange={(event) => setFilters({ sortDirection: event.target.value as "asc" | "desc" })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading || isAnalyzingImage}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm text-white hover:bg-[#1D2981]/90 disabled:opacity-60"
            >
              <Search className="size-4" />{" "}
              {isAnalyzingImage ? "Analyzing image..." : isLoading ? "Searching..." : "Search records"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </form>
      </aside>

      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
    </section>
  );
}
