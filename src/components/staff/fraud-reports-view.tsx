"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CustomToast } from "@/components/ui/custom-toast";
import { toTimestampMillis } from "@/lib/date-time-helpers";
import { fraudReportKeys, useFraudReports } from "@/hooks/queries/fraud-report-queries";
import { resolveFraudReport, updateFraudReportStatus } from "@/services/fraud-reports-service";
import {
  FraudReportsFeed,
  FraudReportsRejectModal,
  FraudReportsSidebar,
} from "@/components/staff/fraud-reports-view-sections";
import type {
  FraudReport,
  FraudReportAction,
  FraudReportFilters,
  FraudReportSortDirection,
} from "@/types/fraud-report";

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
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FraudReportFilters>({ status: "all" });
  const [sortDir, setSortDir] = useState<FraudReportSortDirection>("desc");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [pendingRejectReport, setPendingRejectReport] = useState<FraudReport | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);

  const fraudReportsQuery = useFraudReports(sortDir, 10);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredReports = useMemo(() => {
    const reports = fraudReportsQuery.data?.pages.flat() ?? [];
    const filtered = reports.filter((report) => filters.status === "all" || report.reportStatus === filters.status);
    const sorted = [...filtered].sort((a, b) => {
      const diff = getSortValue(a) - getSortValue(b);
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [filters, fraudReportsQuery.data?.pages, sortDir]);

  const invalidateReports = async () => {
    await queryClient.invalidateQueries({ queryKey: fraudReportKeys.list(sortDir, 10) });
  };

  const handleAction = (action: FraudReportAction, report: FraudReport) => {
    if (action === "view") {
      router.push(`/staff/fraud-report/view/${report.reportId}`);
      return;
    }

    if (action === "open") {
      updateFraudReportStatus(report.reportId, "open")
        .then(async () => {
          await invalidateReports();
          setToast({ message: "Fraud report opened", tone: "success" });
        })
        .catch(() => setToast({ message: "Failed to open fraud report", tone: "danger" }));
      return;
    }

    if (action === "resolve") {
      resolveFraudReport(report.reportId, false)
        .then(async () => {
          await invalidateReports();
          setToast({ message: "Fraud report resolved", tone: "success" });
        })
        .catch(() => setToast({ message: "Failed to resolve fraud report", tone: "danger" }));
      return;
    }

    if (action === "reject") {
      setPendingRejectReport(report);
      setSelectedRejectReason("");
    }
  };

  const handleRefresh = async () => {
    await fraudReportsQuery.refetch();
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!fraudReportsQuery.hasNextPage || fraudReportsQuery.isFetchingNextPage) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      void fraudReportsQuery.fetchNextPage();
    }
  };

  const handleRejectConfirm = () => {
    if (!pendingRejectReport) return;
    if (!selectedRejectReason) {
      setToast({ message: "Please select a rejection reason", tone: "danger" });
      return;
    }

    updateFraudReportStatus(pendingRejectReport.reportId, "rejected")
      .then(async () => {
        await invalidateReports();
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

  const errorMessage = fraudReportsQuery.error instanceof Error ? fraudReportsQuery.error.message : null;

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <FraudReportsFeed
        feedRef={feedRef}
        onScroll={handleScroll}
        errorMessage={errorMessage}
        isLoading={fraudReportsQuery.isLoading}
        filteredReports={filteredReports}
        hasNextPage={fraudReportsQuery.hasNextPage}
        onAction={handleAction}
      />
      <FraudReportsSidebar
        filters={filters}
        sortDir={sortDir}
        statusOptions={statusOptions}
        sortOptions={sortOptions}
        isRefetching={fraudReportsQuery.isRefetching}
        onStatusChange={(value) => setFilters({ status: value })}
        onSortChange={setSortDir}
        onRefresh={() => void handleRefresh()}
      />

      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
      <FraudReportsRejectModal
        isOpen={Boolean(pendingRejectReport)}
        rejectReasons={rejectReasons}
        selectedRejectReason={selectedRejectReason}
        onSelectReason={setSelectedRejectReason}
        onCancel={() => {
          setPendingRejectReport(null);
          setSelectedRejectReason("");
        }}
        onConfirm={handleRejectConfirm}
      />
    </section>
  );
}
