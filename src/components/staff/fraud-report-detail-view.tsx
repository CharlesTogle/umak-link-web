"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleUserRound, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { parseReasonForReporting } from "@/lib/parse-reason-for-reporting";
import { useCurrentUser } from "@/hooks/use-current-user";
import { sendNotification } from "@/services/notifications-service";
import { getPostByItemDetails, updatePostStatus } from "@/services/posts-service";
import {
  getFraudReport,
  resolveFraudReport,
  updateFraudReportStatus,
} from "@/services/fraud-reports-service";
import type { ApiFraudReportPublic } from "@/types/fraud-report-api";
import type { ApiPostRecordDetails } from "@/types/post-record-api";

type ToastTone = "success" | "danger";

const REJECT_REASONS = [
  "Reporter has insufficient evidence.",
  "Original Claim was verified as legitimate.",
  "Item misidentification.",
  "This is a spam or malicious report.",
  "The report is duplicated.",
] as const;

function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function toDisplayLabel(value: string | null | undefined, fallback = "Unknown"): string {
  if (!value) return fallback;
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status: string): string {
  const normalized = normalizeValue(status);
  if (normalized === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (normalized === "open") return "border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function Overlay({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">{children}</div>;
}

export function FraudReportDetailView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [report, setReport] = useState<ApiFraudReportPublic | null>(null);
  const [linkedMissingItem, setLinkedMissingItem] = useState<ApiPostRecordDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCloseChoiceModal, setShowCloseChoiceModal] = useState(false);

  const reportStatus = useMemo(() => normalizeValue(report?.report_status ?? "under_review"), [report?.report_status]);
  const { reason, details } = parseReasonForReporting(report?.reason_for_reporting ?? report?.reason ?? "");

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getFraudReport(reportId);
      setReport(response);

      if (response.linked_lost_item_id) {
        const linkedItem = await getPostByItemDetails(response.linked_lost_item_id);
        setLinkedMissingItem(linkedItem);
      } else {
        setLinkedMissingItem(null);
      }
    } catch {
      setReport(null);
      setLinkedMissingItem(null);
      showToast("Failed to load fraud report", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [reportId, showToast]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleOpenReport = async () => {
    if (!report || isProcessing) return;

    setIsProcessing(true);
    try {
      await updateFraudReportStatus(report.report_id, "open", user?.user_id);

      if (report.reporter_id) {
        await sendNotification({
          user_id: report.reporter_id,
          title: "Fraud Report Opened",
          body: `Your report on "${report.item_name ?? "Unknown Item"}" has been opened and is being investigated. Thank you for helping keep UMak LINK safe.`,
          type: "acceptance",
        });
      }

      await fetchReport();
      showToast("Fraud report opened", "success");
    } catch {
      showToast("Failed to open report", "danger");
    } finally {
      setIsProcessing(false);
      setShowAcceptModal(false);
    }
  };

  const handleRejectReport = async (reasonText: string) => {
    if (!report || isProcessing) return;

    setIsProcessing(true);
    try {
      await updateFraudReportStatus(report.report_id, "rejected", user?.user_id);
      await updatePostStatus(String(report.post_id), { status: "accepted" });

      if (report.reporter_id) {
        await sendNotification({
          user_id: report.reporter_id,
          title: "Fraud Report Rejected",
          body: `Your report on \"${report.item_name ?? "Unknown Item"}\" has been rejected. Reason: ${reasonText}`,
          type: "rejection",
        });
      }

      await fetchReport();
      showToast("Fraud report rejected successfully", "success");
    } catch {
      showToast("Failed to reject report", "danger");
    } finally {
      setIsProcessing(false);
      setShowRejectModal(false);
    }
  };

  const handleCloseReport = async (deleteClaim: boolean) => {
    if (!report || isProcessing) return;

    setIsProcessing(true);
    try {
      await resolveFraudReport(report.report_id, deleteClaim);

      if (report.reporter_id) {
        if (deleteClaim) {
          await sendNotification({
            user_id: report.reporter_id,
            title: "Report Resolved - Item Available",
            body: `Your report on "${report.item_name ?? "Unknown Item"}" has been resolved. The item is now available for claiming again. Thank you for keeping UMak LINK safe.`,
            type: "acceptance",
          });
        } else {
          await sendNotification({
            user_id: report.reporter_id,
            title: "Report Resolved",
            body: `Your report on "${report.item_name ?? "Unknown Item"}" has been resolved. The staff decided not to retrieve the item from the claimer.`,
            type: "info",
          });
        }
      }

      await fetchReport();
      showToast("Report accepted successfully", "success");
    } catch {
      showToast("Failed to accept report", "danger");
    } finally {
      setIsProcessing(false);
      setShowCloseChoiceModal(false);
    }
  };

  const closeReportChoices = linkedMissingItem
    ? [
        {
          label: "Yes, delete claim",
          description:
            "Delete the claim and set item as unclaimed. Linked missing item will reset to lost status.",
          deleteClaim: true,
        },
        {
          label: "No, keep claim",
          description: "Keep the current claim and leave item status as claimed.",
          deleteClaim: false,
        },
      ]
    : [
        {
          label: "Yes, delete claim",
          description: "Delete the claim and set item as unclaimed.",
          deleteClaim: true,
        },
        {
          label: "No, keep claim",
          description: "Keep the current claim and leave item status as claimed.",
          deleteClaim: false,
        },
      ];

  const canMarkOpen = ["under_review", "rejected", "resolved", "verified", "accepted"].includes(reportStatus);
  const canRejectOrAccept = reportStatus === "open" && user?.user_id === report?.fraud_reviewer_id;

  if (isLoading) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-5 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-6 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">No report found</h1>
          <button
            type="button"
            onClick={() => router.push("/staff/fraud-reports")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a]"
          >
            <ArrowLeft className="size-4" /> Go back
          </button>
        </div>
      </section>
    );
  }

  return (
    <PhotoProvider>
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
      <article className="rounded-3xl border border-slate-200 bg-white py-3 px-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/staff/fraud-reports")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" /> Back to Fraud Reports
          </button>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(report.report_status ?? "under_review")}`}>
            {toDisplayLabel(report.report_status ?? "under_review")}
          </span>
        </div>
      </article>

      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8 lg:col-start-1">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
            {report.reporter_profile_picture_url ? (
              <Image
                src={report.reporter_profile_picture_url}
                alt={report.reporter_name ?? "Reporter"}
                width={40}
                height={40}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <CircleUserRound className="size-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{report.reporter_name ?? "Anonymous Reporter"}</p>
            <p className="text-xs text-slate-500">
              Reported {formatDateTimeInPhilippineTime(report.date_reported ?? report.created_at, "Unknown")}
            </p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900">{reason}</h1>
        {details ? <p className="mt-2 text-sm text-slate-600">{details}</p> : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-[#1D2981]">Reported Item</p>
          <div className="flex flex-wrap gap-4">
            <div className="relative h-36 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {report.item_image_url ? (
                <PhotoView src={report.item_image_url}>
                  <div className="relative h-full w-full cursor-zoom-in">
                    <Image
                      src={report.item_image_url}
                      alt={report.item_name ?? "Reported item"}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="208px"
                    />
                  </div>
                </PhotoView>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
              )}
            </div>
            <div className="min-w-[220px] flex-1 text-sm text-slate-600">
              <p className="text-lg font-semibold text-slate-900">{report.item_name ?? "Unknown Item"}</p>
              <p className="mt-1">{report.item_description ?? "No description provided."}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Poster:</span> {report.poster_name ?? "Unknown User"}
              </p>
              <button
                type="button"
                onClick={() => router.push(`/staff/post-record/view/${report.post_id}`)}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <ShieldAlert className="size-3.5" /> View post record
              </button>
            </div>
          </div>
        </div>

        {linkedMissingItem ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-semibold text-[#1D2981]">Linked Missing Item</p>
            <div className="flex flex-wrap gap-4">
              <div className="relative h-36 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {linkedMissingItem.item_image_url ? (
                  <PhotoView src={linkedMissingItem.item_image_url}>
                    <div className="relative h-full w-full cursor-zoom-in">
                      <Image
                        src={linkedMissingItem.item_image_url}
                        alt={linkedMissingItem.item_name}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="208px"
                      />
                    </div>
                  </PhotoView>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                )}
              </div>
              <div className="min-w-[220px] flex-1 text-sm text-slate-600">
                <p className="text-lg font-semibold text-slate-900">{linkedMissingItem.item_name}</p>
                <p className="mt-1">{linkedMissingItem.item_description ?? "No description provided."}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/staff/post-record/view/${linkedMissingItem.post_id}`)}
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <ShieldAlert className="size-3.5" /> View linked item
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {report.proof_image_url ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-[#1D2981]">Proof of Report</p>
            <PhotoView src={report.proof_image_url}>
              <div className="relative mt-2 h-64 w-full cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-white md:h-80">
                <Image
                  src={report.proof_image_url}
                  alt="Proof of report"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            </PhotoView>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Date reported:</span>{" "}
          {formatDateTimeInPhilippineTime(report.date_reported ?? report.created_at, "Unknown")}
        </p>

        {canMarkOpen ? (
          <div className="mt-5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setShowAcceptModal(true)}
              className="w-full rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Mark Open"}
            </button>
          </div>
        ) : null}

        {canRejectOrAccept ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setShowRejectModal(true)}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Reject"}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setShowCloseChoiceModal(true)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Accept"}
            </button>
          </div>
        ) : null}
      </article>

      <aside className="space-y-4 lg:col-span-4 lg:col-start-9">
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Report Status</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{toDisplayLabel(report.report_status ?? "under_review")}</p>
          <p className="mt-1 text-sm text-slate-600">
            Processed by <span className="font-medium text-slate-800">{report.fraud_reviewer_name ?? "a staff member"}</span>
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Claim Credentials</h2>
          <div className="mt-3 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Claimer</p>
              <p>{report.claimer_name ?? "Unknown"}</p>
              <p>{report.claimer_school_email ?? "No email provided"}</p>
              {report.claimer_contact_num ? <p>{report.claimer_contact_num}</p> : null}
              {report.claimed_at ? (
                <p className="text-xs text-slate-500">
                  Claimed at: {formatDateTimeInPhilippineTime(report.claimed_at, "Unknown")}
                </p>
              ) : null}
            </div>

            <div>
              <p className="font-semibold text-slate-800">Claim Approved by Staff</p>
              <p>{report.claim_processed_by_name ?? "Not yet approved"}</p>
              <p>{report.claim_processed_by_email ?? "Not yet approved"}</p>
            </div>

            {reportStatus !== "under_review" ? (
              <div>
                <p className="font-semibold text-slate-800">Report Processed by Staff</p>
                <p>{report.fraud_reviewer_name ?? "Unknown"}</p>
                <p>{report.fraud_reviewer_email ?? "Unknown"}</p>
              </div>
            ) : null}
          </div>
        </article>
      </aside>
      </div>

      {showAcceptModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Mark report as open?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Once opened by you, other staff cannot open this report. Continue?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleOpenReport()}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isProcessing ? "Opening..." : "Mark Open"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {showRejectModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Reject Report</h2>
            <p className="mt-2 text-sm text-slate-600">Select a reason to reject this report.</p>
            <div className="mt-4 space-y-2">
              {REJECT_REASONS.map((reasonText) => (
                <button
                  key={reasonText}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleRejectReport(reasonText)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {reasonText}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {showCloseChoiceModal ? (
        <Overlay>
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Accept Report - Claim Action</h2>
            <p className="mt-2 text-sm text-slate-600">Choose what to do with the claim record.</p>
            <div className="mt-4 space-y-2">
              {closeReportChoices.map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleCloseReport(choice.deleteClaim)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <p className="font-medium text-slate-900">{choice.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{choice.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCloseChoiceModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {toast ? (
        <div
          className={`fixed right-6 top-6 z-[60] rounded-2xl px-4 py-2 text-sm text-white shadow-lg ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      </section>
    </PhotoProvider>
  );
}
