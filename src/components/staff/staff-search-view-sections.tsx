"use client";

import { AlertTriangle, Filter, Inbox, RefreshCcw, RotateCw, Search, WifiOff, X } from "lucide-react";
import { PostRecordCard } from "@/components/staff/post-record-card";
import type { PostRecord, PostRecordAction } from "@/types/post-record";
import type { SearchItemStatus, SearchPostStatus, StaffSearchFilters } from "@/types/search";

export function chipClass(isActive: boolean): string {
  return isActive
    ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100";
}

export function SearchResultsPanel(props: {
  autoSearchFromUrl: boolean;
  submittedQuery: string;
  submittedDisplayQuery: string;
  isOffline: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  results: PostRecord[];
  onCancel: () => void;
  onRetry: () => void;
  onAction: (action: PostRecordAction, record: PostRecord) => void;
}) {
  const hasSubmittedSearch =
    props.autoSearchFromUrl && Boolean(props.submittedQuery.trim());
  const showReadyState =
    !hasSubmittedSearch &&
    !props.isLoading &&
    !props.errorMessage &&
    !props.isOffline &&
    props.results.length === 0;
  const showEmptyResults =
    hasSubmittedSearch &&
    !props.isLoading &&
    !props.errorMessage &&
    !props.isOffline &&
    props.results.length === 0;

  return (
    <div className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Search</h1>
          <p className="mt-1 text-sm text-slate-600">Find post records using keyword + advanced filters.</p>
          {props.autoSearchFromUrl && props.submittedDisplayQuery ? (
            <p className="mt-2 text-sm text-slate-600">
              Showing results for <span className="font-semibold text-slate-800">&quot;{props.submittedDisplayQuery}&quot;</span>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={props.onCancel}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      {props.isOffline ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <WifiOff className="size-4" /> No internet connection
          </div>
          <p className="mt-2 text-sm">Reconnect to the internet to run search and load results.</p>
          <button type="button" onClick={props.onRetry} className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm hover:bg-amber-100">
            <RotateCw className="size-4" /> Retry
          </button>
        </div>
      ) : null}

      {props.errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4" /> Search failed
          </div>
          <p className="mt-2 text-sm">{props.errorMessage}</p>
          <button type="button" onClick={props.onRetry} className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm hover:bg-rose-100">
            <RefreshCcw className="size-4" /> Retry search
          </button>
        </div>
      ) : null}

      {showReadyState ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">Enter a keyword, apply filters, then click <span className="font-semibold">Search records</span>.</div> : null}

      {props.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`search-loading-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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

      {!props.isLoading && !props.errorMessage && !props.isOffline && props.results.length > 0 ? (
        <div className="space-y-4">
          {props.results.map((record) => <PostRecordCard key={record.postId} record={record} onAction={props.onAction} />)}
        </div>
      ) : null}
    </div>
  );
}

export function SearchControlsPanel(props: {
  query: string;
  filters: StaffSearchFilters;
  recentSearches: string[];
  selectedImage: File | null;
  isLoading: boolean;
  isAnalyzingImage: boolean;
  itemStatusOptions: Array<{ label: string; value: SearchItemStatus }>;
  postStatusOptions: Array<{ label: string; value: SearchPostStatus }>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onQueryChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onLastSeenDateChange: (value: string) => void;
  onClaimFromDateChange: (value: string) => void;
  onClaimToDateChange: (value: string) => void;
  onToggleItemStatus: (value: SearchItemStatus) => void;
  onTogglePostStatus: (value: SearchPostStatus) => void;
  onSortChange: (value: "accepted_on_date" | "submission_date") => void;
  onSortDirectionChange: (value: "asc" | "desc") => void;
  onUseRecentSearch: (value: string) => void;
  onRemoveRecentSearch: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
      <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={props.onSubmit}>
        <p className="mb-1 text-sm font-semibold text-[#1D2981]">Search Query</p>
        <label className="sr-only" htmlFor="staff-search-keyword">Search keyword</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input id="staff-search-keyword" value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="e.g. black wallet, ID lace" className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-[#1D2981]/30" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reverse Image Search</p>
          <input type="file" accept="image/*" onChange={(event) => props.onImageChange(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
          {props.selectedImage ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span className="truncate">{props.selectedImage.name}</span>
              <button type="button" onClick={() => props.onImageChange(null)} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50">Remove</button>
            </div>
          ) : null}
        </div>

        {props.recentSearches.length > 0 ? (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Searches</p>
            <div className="space-y-2">
              {props.recentSearches.map((recentSearch) => (
                <div
                  key={recentSearch}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => props.onUseRecentSearch(recentSearch)}
                    className="min-w-0 flex-1 truncate text-left text-sm text-slate-700 hover:text-[#1D2981]"
                  >
                    {recentSearch}
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onRemoveRecentSearch(recentSearch)}
                    className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label={`Remove recent search ${recentSearch}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Filter className="size-3.5" /> Filters</p>
          <div className="space-y-2">
            <div>
              <label htmlFor="search-category" className="mb-1 block text-xs font-medium text-slate-600">Category</label>
              <input id="search-category" value={props.filters.category} onChange={(event) => props.onCategoryChange(event.target.value)} placeholder="Category" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
            </div>
            <div>
              <label htmlFor="search-location" className="mb-1 block text-xs font-medium text-slate-600">Last seen location</label>
              <input id="search-location" value={props.filters.locationLastSeen} onChange={(event) => props.onLocationChange(event.target.value)} placeholder="Last seen location" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
            </div>
            <div>
              <label htmlFor="search-last-seen-date" className="mb-1 block text-xs font-medium text-slate-600">Last seen date</label>
              <input id="search-last-seen-date" type="date" value={props.filters.lastSeenDate} onChange={(event) => props.onLastSeenDateChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="search-claim-from" className="mb-1 block text-xs font-medium text-slate-600">Claim from</label>
                <input id="search-claim-from" type="date" value={props.filters.claimFromDate} onChange={(event) => props.onClaimFromDateChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
              </div>
              <div>
                <label htmlFor="search-claim-to" className="mb-1 block text-xs font-medium text-slate-600">Claim to</label>
                <input id="search-claim-to" type="date" value={props.filters.claimToDate} onChange={(event) => props.onClaimToDateChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Item Status</p>
          <div className="flex flex-wrap gap-2">
            {props.itemStatusOptions.map((status) => (
              <button key={status.value} type="button" onClick={() => props.onToggleItemStatus(status.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${chipClass(props.filters.itemStatuses.includes(status.value))}`}>
                {status.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Post Status</p>
          <div className="flex flex-wrap gap-2">
            {props.postStatusOptions.map((status) => (
              <button key={status.value} type="button" onClick={() => props.onTogglePostStatus(status.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${chipClass(props.filters.postStatuses.includes(status.value))}`}>
                {status.label}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="search-sort-field" className="sr-only">Sort field</label>
            <select id="search-sort-field" value={props.filters.sort} onChange={(event) => props.onSortChange(event.target.value as "accepted_on_date" | "submission_date")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="submission_date">Sort by Submission</option>
              <option value="accepted_on_date">Sort by Accepted Date</option>
            </select>
          </div>
          <div>
            <label htmlFor="search-sort-direction" className="sr-only">Sort direction</label>
            <select id="search-sort-direction" value={props.filters.sortDirection} onChange={(event) => props.onSortDirectionChange(event.target.value as "asc" | "desc")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={props.isLoading || props.isAnalyzingImage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm text-white hover:bg-[#1D2981]/90 disabled:opacity-60">
            <Search className="size-4" /> {props.isAnalyzingImage ? "Analyzing image..." : props.isLoading ? "Searching..." : "Search records"}
          </button>
          <button type="button" onClick={props.onClear} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Clear</button>
        </div>
      </form>
    </aside>
  );
}
