"use client";

import Image from "next/image";
import { ArrowLeft, CircleUserRound } from "lucide-react";
import { PhotoView } from "react-photo-view";
import { Overlay } from "@/components/ui/overlay";
import { PostRecordPreviewCard } from "@/components/staff/post-record-preview-card";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { toDisplayLabel } from "@/lib/format-utils";
import type { ApiFraudReportPublic } from "@/types/fraud-report-api";
import type { ApiPostRecordDetails } from "@/types/post-record-api";

interface CloseChoice {
  label: string;
  description: string;
  deleteClaim: boolean;
}

function getClaimProcessedByLabel(
  userType?: "User" | "Staff" | "Admin" | "Guard" | null
): string {
  switch (userType) {
    case "Guard":
      return "Claim Processed by Guard";
    case "Admin":
      return "Claim Processed by Admin";
    case "User":
      return "Claim Processed by User";
    case "Staff":
    default:
      return "Claim Processed by Staff";
  }
}

export function FraudReportHeader(props: {
  report: ApiFraudReportPublic;
  getStatusBadgeClass: (status: string) => string;
  onBack: () => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={props.onBack} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="size-4" /> Back to Fraud Reports
        </button>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${props.getStatusBadgeClass(props.report.report_status ?? "under_review")}`}>
          {toDisplayLabel(props.report.report_status ?? "under_review")}
        </span>
      </div>
    </article>
  );
}

export function FraudReportMainPanel(props: {
  report: ApiFraudReportPublic;
  reason: string;
  details: string;
  linkedMissingItem: ApiPostRecordDetails | null;
  canOpenReport: boolean;
  canRejectReport: boolean;
  canCloseReport: boolean;
  canDeleteReport: boolean;
  closeReportConfirmed: boolean;
  isProcessing: boolean;
  onViewPostRecord: () => void;
  onViewLinkedItem: () => void;
  onOpen: () => void;
  onReject: () => void;
  onToggleCloseConfirmed: (checked: boolean) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { report, linkedMissingItem } = props;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8 lg:col-start-1">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
          {report.reporter_profile_picture_url ? (
            <Image src={report.reporter_profile_picture_url} alt={report.reporter_name ?? "Reporter"} width={40} height={40} unoptimized className="size-full object-cover" />
          ) : (
            <CircleUserRound className="size-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{report.reporter_name ?? "Anonymous Reporter"}</p>
          <p className="text-xs text-slate-500">Reported {formatDateTimeInPhilippineTime(report.date_reported ?? report.created_at, "Unknown")}</p>
        </div>
      </div>

      <h1 className="text-xl font-bold text-slate-900">{props.reason}</h1>
      {props.details ? <p className="mt-2 text-sm text-slate-600">{props.details}</p> : null}

      <PostRecordPreviewCard
        sectionLabel="Reported Item"
        post={{
          is_anonymous: Boolean(report.is_anonymous),
          item_name: report.item_name ?? "Unknown Item",
          item_description: report.item_description ?? null,
          item_image_url: report.item_image_url ?? null,
          poster_name: report.poster_name ?? "Unknown User",
        }}
        actionLabel="View post record"
        className="mt-4"
        onAction={props.onViewPostRecord}
      />

      {linkedMissingItem ? (
        <PostRecordPreviewCard
          sectionLabel="Linked Missing Item"
          post={linkedMissingItem}
          actionLabel="View linked item"
          className="mt-4"
          onAction={props.onViewLinkedItem}
        />
      ) : null}

      {report.proof_image_url ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#1D2981]">Proof of Report</p>
          <PhotoView src={report.proof_image_url}>
            <div className="relative mt-2 h-64 w-full cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-white md:h-80">
              <Image src={report.proof_image_url} alt="Proof of report" fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
            </div>
          </PhotoView>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-slate-500"><span className="font-medium text-slate-700">Date reported:</span> {formatDateTimeInPhilippineTime(report.date_reported ?? report.created_at, "Unknown")}</p>

      {(props.canOpenReport || props.canRejectReport) ? (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {props.canRejectReport ? (
            <button type="button" disabled={props.isProcessing} onClick={props.onReject} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
              {props.isProcessing ? "Processing..." : "Reject"}
            </button>
          ) : null}
          {props.canOpenReport ? (
            <button type="button" disabled={props.isProcessing} onClick={props.onOpen} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {props.isProcessing ? "Processing..." : "Open"}
            </button>
          ) : null}
        </div>
      ) : null}

      {props.canCloseReport ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-[#1D2981]">Close Report</p>
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              id="close-report-confirmation"
              type="checkbox"
              checked={props.closeReportConfirmed}
              onChange={(event) => props.onToggleCloseConfirmed(event.target.checked)}
              className="mt-1 size-4 accent-[#1D2981]"
            />
            <label htmlFor="close-report-confirmation" className="text-sm text-slate-700">
              I confirm that this case has been properly taken care of.
            </label>
          </div>
          <button
            type="button"
            disabled={!props.closeReportConfirmed || props.isProcessing}
            onClick={props.onClose}
            className="mt-3 w-full rounded-full bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#16206a] disabled:opacity-60"
          >
            {props.isProcessing ? "Processing..." : "Close Report"}
          </button>
        </div>
      ) : null}

      {props.canDeleteReport ? (
        <div className="mt-5">
          <button type="button" disabled={props.isProcessing} onClick={props.onDelete} className="w-full rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
            {props.isProcessing ? "Deleting..." : "Delete Report"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function FraudReportSidebar(props: { report: ApiFraudReportPublic; reportStatus: string }) {
  const { report } = props;
  return (
    <aside className="space-y-4 lg:col-span-4 lg:col-start-9">
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Report Status</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{toDisplayLabel(report.report_status ?? "under_review")}</p>
        <p className="mt-1 text-sm text-slate-600">Processed by <span className="font-medium text-slate-800">{report.fraud_reviewer_name ?? "a staff member"}</span></p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Claim Credentials</h2>
        <p className="mt-1 text-sm text-slate-600">Information about the claimer and the user who processed the claim.</p>
        <div className="mt-3 space-y-4 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-800">Claimer</p>
            <p>{report.claimer_name ?? "Unknown"}</p>
            <p>{report.claimer_school_email ?? "No email provided"}</p>
            {report.claimer_contact_num ? <p>{report.claimer_contact_num}</p> : null}
            {report.claimed_at ? <p className="text-xs text-slate-500">Claimed at: {formatDateTimeInPhilippineTime(report.claimed_at, "Unknown")}</p> : null}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{getClaimProcessedByLabel(report.claim_processed_by_user_type)}</p>
            <p>{report.claim_processed_by_name ?? "Not yet approved"}</p>
            <p>{report.claim_processed_by_email ?? "Not yet approved"}</p>
          </div>
          {props.reportStatus !== "under_review" ? (
            <div>
              <p className="font-semibold text-slate-800">Report Processed by Staff</p>
              <p>{report.fraud_reviewer_name ?? "Unknown"}</p>
              <p>{report.fraud_reviewer_email ?? "Unknown"}</p>
            </div>
          ) : null}
        </div>
      </article>
    </aside>
  );
}

export function FraudReportModals(props: {
  showAcceptModal: boolean;
  showRejectModal: boolean;
  showCloseChoiceModal: boolean;
  showDeleteModal: boolean;
  isProcessing: boolean;
  rejectReasons: readonly string[];
  closeReportChoices: CloseChoice[];
  onCancelAccept: () => void;
  onConfirmAccept: () => void;
  onCancelReject: () => void;
  onReject: (reason: string) => void;
  onCancelCloseChoice: () => void;
  onConfirmCloseChoice: (deleteClaim: boolean) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <>
      {props.showAcceptModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Open report?</h2>
            <p className="mt-2 text-sm text-slate-600">Once opened by you, other staff cannot open this report. Email notifications will also be sent to the claimer and any staff or guard involved in the original handover.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={props.onCancelAccept} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={props.isProcessing} onClick={props.onConfirmAccept} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                {props.isProcessing ? "Opening..." : "Open"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {props.showRejectModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Reject Report</h2>
            <p className="mt-2 text-sm text-slate-600">Select a reason to reject this report.</p>
            <div className="mt-4 space-y-2">
              {props.rejectReasons.map((reasonText) => (
                <button key={reasonText} type="button" disabled={props.isProcessing} onClick={() => props.onReject(reasonText)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  {reasonText}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={props.onCancelReject} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {props.showCloseChoiceModal ? (
        <Overlay>
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Close Report - Claim Action</h2>
            <p className="mt-2 text-sm text-slate-600">Choose what to do with the claim record before closing this report.</p>
            <div className="mt-4 space-y-2">
              {props.closeReportChoices.map((choice) => (
                <button key={choice.label} type="button" disabled={props.isProcessing} onClick={() => props.onConfirmCloseChoice(choice.deleteClaim)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  <p className="font-medium text-slate-900">{choice.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{choice.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={props.onCancelCloseChoice} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {props.showDeleteModal ? (
        <Overlay>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Delete rejected report?</h2>
            <p className="mt-2 text-sm text-slate-600">This permanently removes the rejected fraud report record.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={props.onCancelDelete} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={props.isProcessing} onClick={props.onConfirmDelete} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
                {props.isProcessing ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
