"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { FraudReportCard } from "@/components/staff/fraud-report-card";
import { CustomToast } from "@/components/ui/custom-toast";
import { toTimestampMillis } from "@/lib/date-time-helpers";
import { useStaffFraudReportsStore } from "@/stores/staff-fraud-reports-store";
import type { FraudReport, FraudReportAction, FraudReportFilters, FraudReportSortDirection } from "@/types/fraud-report";

const statusOptions: Array<{ label: string; value: FraudReportFilters["status"] }> = [
  { label: "All", value: "all" },
  { label: "Under Review", value: "Under Review" },
  { label: "Open", value: "Open" },
  { label: "Rejected", value: "Rejected" },
  { label: "Resolved", value: "Resolved" },
];

const sortOptions: Array<{ label: string; value: FraudReportSortDirection }> = [
  { label: "Most Recent", value: "desc" },
  { label: "Oldest First", value: "asc" },
];

const rejectReasons = [
  "Reporter has insufficient evidence.",
  "Original Claim was verified as legitimate.",
  "Item misidentification.",
  "This is a spam or malicious report.",
  "The report is duplicated.",
];

function getSortValue(report: FraudReport): number {
  return toTimestampMillis(report.dateReported);
}

export function FraudReportsView() {
  const router = useRouter();
  const {
    reports,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    fetchReports,
    loadMore,
    refresh,
    openReport,
    rejectReport,
    resolveReport,
  } = useStaffFraudReportsStore();
  const [filters, setFilters] = useState<FraudReportFilters>({ status: "all" });
  const [sortDir, setSortDir] = useState<FraudReportSortDirection>("desc");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [pendingRejectReport, setPendingRejectReport] = useState<FraudReport | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>("");
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredReports = useMemo(() => {
    const filtered = reports.filter((report) => filters.status === "all" || report.reportStatus === filters.status);
    const sorted = [...filtered].sort((a, b) => {
      const diff = getSortValue(a) - getSortValue(b);
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [reports, filters, sortDir]);

  useEffect(() => {
    fetchReports({ sortDirection: sortDir, pageSize: 10 });
  }, [fetchReports, sortDir]);

  const handleAction = (action: FraudReportAction, report: FraudReport) => {
    if (action === "view") {
      router.push(`/staff/fraud-report/view/${report.reportId}`);
      return;
    }

    if (action === "open") {
      openReport(report.reportId)
        .then(() => setToast({ message: "Fraud report opened", tone: "success" }))
        .catch(() => setToast({ message: "Failed to open fraud report", tone: "danger" }));
      return;
    }

    if (action === "resolve") {
      resolveReport(report.reportId)
        .then(() => setToast({ message: "Fraud report resolved", tone: "success" }))
        .catch(() => setToast({ message: "Failed to resolve fraud report", tone: "danger" }));
      return;
    }

    if (action === "reject") {
      setPendingRejectReport(report);
      setSelectedRejectReason("");
    }
  };

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

  const handleRejectConfirm = () => {
    if (!pendingRejectReport) return;
    if (!selectedRejectReason) {
      setToast({ message: "Please select a rejection reason", tone: "danger" });
      return;
    }

    rejectReport(pendingRejectReport.reportId)
      .then(() => {
        setToast({
          message: `Fraud report rejected: ${selectedRejectReason}`,
          tone: "danger",
        });
      })
      .catch(() => {
        setToast({ message: "Failed to reject fraud report", tone: "danger" });
      })
      .finally(() => {
        setPendingRejectReport(null);
        setSelectedRejectReason("");
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
          <h1 className="text-3xl font-bold text-[#1D2981]">Fraud Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Review and resolve reports flagged by staff.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading && filteredReports.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`fraud-loading-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {filteredReports.length === 0 && !isLoading ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No fraud reports match the selected filters.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <FraudReportCard key={report.reportId} report={report} onAction={handleAction} />
            ))}
          </div>
        )}
        {!hasMore && filteredReports.length > 0 ? (
          <p className="text-center text-sm text-slate-500">You&apos;re all caught up!</p>
        ) : null}
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#1D2981]">Filters & Sorting</p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Sort:</span>
              <select
                value={sortDir}
                onChange={(event) => setSortDir(event.target.value as FraudReportSortDirection)}
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

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Report Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const isActive = filters.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilters({ status: option.value })}
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
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[#1D2981]">Refresh</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <RefreshCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh reports"}
          </button>
        </div>
      </aside>

      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}

      {pendingRejectReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Reject Report</h2>
            <p className="mt-2 text-sm text-slate-600">Select a reason to reject the report.</p>
            <p className="mt-1 text-xs text-slate-500">Reporter will be notified upon submission.</p>
            <div className="mt-4 space-y-2">
              {rejectReasons.map((reason) => {
                const isActive = selectedRejectReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedRejectReason(reason)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingRejectReport(null)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
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
