import type { FraudReport } from "@/types/fraud-report";
import type { ApiFraudReportPublic } from "@/types/fraud-report-api";

function toTitleCase(value: string | null | undefined): string {
  if (!value) return "Under Review";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapStatus(value: string | null | undefined): FraudReport["reportStatus"] {
  const status = (value ?? "under_review").toLowerCase();
  if (status === "open") return "Open";
  if (status === "rejected") return "Rejected";
  if (status === "resolved") return "Resolved";
  if (status === "verified") return "Open";
  return "Under Review";
}

export function mapFraudReport(report: ApiFraudReportPublic): FraudReport {
  const reportStatusRaw = report.report_status ?? report.status ?? "under_review";

  return {
    reportId: report.report_id,
    posterName: report.poster_name ?? null,
    posterProfilePictureUrl: report.poster_profile_picture_url ?? null,
    reporterName: report.reporter_name ?? null,
    reporterProfilePictureUrl: report.reporter_profile_picture_url ?? null,
    itemName: report.item_name ?? null,
    itemDescription: report.item_description ?? null,
    itemImageUrl: report.item_image_url ?? null,
    lastSeenAt: report.last_seen_at ?? null,
    reasonForReporting: report.reason_for_reporting ?? report.reason ?? null,
    dateReported: report.date_reported ?? report.created_at ?? null,
    reportStatus: mapStatus(reportStatusRaw),
  };
}

export function formatReportStatus(status: FraudReport["reportStatus"]): string {
  return toTitleCase(status);
}
