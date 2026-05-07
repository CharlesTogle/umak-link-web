"use client";

import { RefreshCcw } from "lucide-react";
import { FraudReportCard } from "@/components/staff/fraud-report-card";
import type { FraudReport, FraudReportAction, FraudReportFilters, FraudReportSortDirection } from "@/types/fraud-report";

interface FraudReportsFeedProps {
  feedRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  errorMessage: string | null;
  isLoading: boolean;
  filteredReports: FraudReport[];
  hasNextPage?: boolean;
  onAction: (action: FraudReportAction, report: FraudReport) => void;
}

export function FraudReportsFeed({
  feedRef,
  onScroll,
  errorMessage,
  isLoading,
  filteredReports,
  hasNextPage,
  onAction,
}: FraudReportsFeedProps) {
  return (
    <div ref={feedRef} onScroll={onScroll} className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1D2981]">Fraud Reports</h1>
        <p className="mt-1 text-sm text-slate-600">Review and resolve reports flagged by staff.</p>
      </div>
      {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
      {isLoading && filteredReports.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`fraud-loading-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}
      {filteredReports.length === 0 && !isLoading ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No fraud reports match the selected filters.</p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => <FraudReportCard key={report.reportId} report={report} onAction={onAction} />)}
        </div>
      )}
      {!hasNextPage && filteredReports.length > 0 ? <p className="text-center text-sm text-slate-500">You&apos;re all caught up!</p> : null}
    </div>
  );
}

interface FraudReportsSidebarProps {
  filters: FraudReportFilters;
  sortDir: FraudReportSortDirection;
  statusOptions: Array<{ label: string; value: FraudReportFilters["status"] }>;
  sortOptions: Array<{ label: string; value: FraudReportSortDirection }>;
  isRefetching: boolean;
  onStatusChange: (value: FraudReportFilters["status"]) => void;
  onSortChange: (value: FraudReportSortDirection) => void;
  onRefresh: () => void;
}

export function FraudReportsSidebar({
  filters,
  sortDir,
  statusOptions,
  sortOptions,
  isRefetching,
  onStatusChange,
  onSortChange,
  onRefresh,
}: FraudReportsSidebarProps) {
  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#1D2981]">Filters & Sorting</p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <label htmlFor="fraud-sort">Sort:</label>
            <select id="fraud-sort" value={sortDir} onChange={(event) => onSortChange(event.target.value as FraudReportSortDirection)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Report Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = filters.status === option.value;
              return (
                <button key={option.value} type="button" onClick={() => onStatusChange(option.value)} className={`rounded-full border px-3 py-1.5 text-sm transition ${isActive ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[#1D2981]">Refresh</p>
        <button type="button" onClick={onRefresh} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50">
          <RefreshCcw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh reports"}
        </button>
      </div>
    </aside>
  );
}

interface FraudReportsRejectModalProps {
  isOpen: boolean;
  rejectReasons: readonly string[];
  selectedRejectReason: string;
  onSelectReason: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function FraudReportsRejectModal({
  isOpen,
  rejectReasons,
  selectedRejectReason,
  onSelectReason,
  onCancel,
  onConfirm,
}: FraudReportsRejectModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">Reject Report</h2>
        <p className="mt-2 text-sm text-slate-600">Select a reason to reject the report.</p>
        <p className="mt-1 text-xs text-slate-500">Reporter will be notified upon submission.</p>
        <div className="mt-4 space-y-2">
          {rejectReasons.map((reason) => {
            const isActive = selectedRejectReason === reason;
            return (
              <button key={reason} type="button" onClick={() => onSelectReason(reason)} className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${isActive ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {reason}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700">Reject report</button>
        </div>
      </div>
    </div>
  );
}
