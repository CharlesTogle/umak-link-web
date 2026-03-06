"use client";

import Image from "next/image";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import type { MouseEvent } from "react";
import { PostTagChip } from "@/components/staff/post-tag-chip";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { parseReasonForReporting } from "@/lib/parse-reason-for-reporting";
import type { FraudReport, FraudReportAction, FraudReportStatus } from "@/types/fraud-report";

const EMPTY_DESCRIPTION = "No description provided.";

function formatDate(value: string | null): string {
  return formatDateTimeInPhilippineTime(value, "Unknown");
}

function statusTone(status: FraudReportStatus): "warning" | "success" | "danger" | "primary" {
  if (status === "Resolved") return "success";
  if (status === "Rejected") return "danger";
  if (status === "Open") return "primary";
  return "warning";
}

export function FraudReportCard({
  report,
  onAction,
}: {
  report: FraudReport;
  onAction: (action: FraudReportAction, report: FraudReport) => void;
}) {
  const { reason, details } = parseReasonForReporting(report.reasonForReporting);
  const reporterLabel = report.reporterName ?? "Anonymous Reporter";
  const posterLabel = report.posterName ?? "Unknown User";
  const handleCardOpen = () => onAction("view", report);
  const handleActionClick = (action: FraudReportAction) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAction(action, report);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardOpen();
        }
      }}
      className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{reporterLabel}</span>
          <span className="mx-2 text-slate-300">•</span>
          <span>{formatDate(report.dateReported)}</span>
        </div>
        <PostTagChip label={report.reportStatus} tone={statusTone(report.reportStatus)} />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{reason}</h3>
      {details ? <p className="mt-1 text-sm text-slate-600">{details}</p> : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-sm font-semibold text-[#1D2981]">Reported Post</div>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-28 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {report.itemImageUrl ? (
              <Image
                src={report.itemImageUrl}
                alt={report.itemName ?? "Reported item"}
                fill
                className="object-cover"
                sizes="160px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                No image
              </div>
            )}
          </div>
          <div className="min-w-[220px] flex-1 text-sm text-slate-600">
            <p className="text-base font-semibold text-slate-900">{report.itemName ?? "Item"}</p>
            <p className="mt-1">{report.itemDescription ?? EMPTY_DESCRIPTION}</p>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Poster:</span> {posterLabel}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-600">Last seen:</span> {formatDate(report.lastSeenAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
          onClick={handleActionClick("view")}
        >
          <Eye className="size-4" /> View details
        </button>
        {report.reportStatus !== "Open" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100"
            onClick={handleActionClick("open")}
          >
            <Eye className="size-4" /> Mark open
          </button>
        ) : null}
        {report.reportStatus !== "Resolved" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100"
            onClick={handleActionClick("resolve")}
          >
            <CheckCircle2 className="size-4" /> Resolve
          </button>
        ) : null}
        {report.reportStatus !== "Rejected" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
            onClick={handleActionClick("reject")}
          >
            <XCircle className="size-4" /> Reject
          </button>
        ) : null}
      </div>
    </article>
  );
}
