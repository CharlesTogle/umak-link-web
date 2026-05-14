"use client";

import { RefreshCcw, Search } from "lucide-react";
import { PostRecordCard } from "@/components/staff/post-record-card";
import type {
  PostRecord,
  PostRecordAction,
  PostRecordFilterKey,
  PostRecordFilters,
  PostRecordSortDirection,
} from "@/types/post-record";

interface PostRecordsFeedProps {
  feedRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  errorMessage: string | null;
  isLoading: boolean;
  records: PostRecord[];
  hasNextPage?: boolean;
  onAction: (action: PostRecordAction, record: PostRecord) => void;
}

export function PostRecordsFeed({
  feedRef,
  onScroll,
  errorMessage,
  isLoading,
  records,
  hasNextPage,
  onAction,
}: PostRecordsFeedProps) {
  return (
    <div ref={feedRef} onScroll={onScroll} className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1D2981]">Post Records</h1>
        <p className="mt-1 text-sm text-slate-600">Review, filter, and manage submitted posts.</p>
      </div>
      {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
      {isLoading && records.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`records-loading-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}
      {records.length === 0 && !isLoading ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No posts match the selected filters.</p>
      ) : (
        <div className="space-y-4">
          {records.map((record) => <PostRecordCard key={record.postId} record={record} onAction={onAction} />)}
        </div>
      )}
      {!hasNextPage && records.length > 0 ? <p className="text-center text-sm text-slate-500">You&apos;re all caught up!</p> : null}
    </div>
  );
}

interface PostRecordsSidebarProps {
  sortDir: PostRecordSortDirection;
  filters: PostRecordFilters;
  sortOptions: Array<{ label: string; value: PostRecordSortDirection }>;
  filterGroups: Array<{
    key: PostRecordFilterKey;
    label: string;
    options: Array<{ label: string; value: PostRecordFilters[PostRecordFilterKey] }>;
  }>;
  isRefetching: boolean;
  onSearch: () => void;
  onRefresh: () => void;
  onSortChange: (value: PostRecordSortDirection) => void;
  onFilterChange: (key: PostRecordFilterKey, value: PostRecordFilters[PostRecordFilterKey]) => void;
}

export function PostRecordsSidebar({
  sortDir,
  filters,
  sortOptions,
  filterGroups,
  isRefetching,
  onSearch,
  onRefresh,
  onSortChange,
  onFilterChange,
}: PostRecordsSidebarProps) {
  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[#1D2981]">Search</p>
        <button type="button" onClick={onSearch} className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm hover:border-slate-300">
          <Search className="size-4 text-slate-400" />
          Search records
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[#1D2981]">Refresh</p>
        <button type="button" onClick={onRefresh} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50">
          <RefreshCcw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh records"}
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#1D2981]">Filters & Sorting</p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <label htmlFor="post-record-sort">Sort:</label>
            <select id="post-record-sort" value={sortDir} onChange={(event) => onSortChange(event.target.value as PostRecordSortDirection)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
                    <button key={`${group.key}-${option.value}`} type="button" onClick={() => onFilterChange(group.key, option.value)} className={`rounded-full border px-3 py-1.5 text-sm transition ${isActive ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>
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
  );
}

interface PostRecordsNotifyModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PostRecordsNotifyModal({
  isOpen,
  title,
  description,
  onCancel,
  onConfirm,
}: PostRecordsNotifyModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]">Confirm</button>
        </div>
      </div>
    </div>
  );
}
