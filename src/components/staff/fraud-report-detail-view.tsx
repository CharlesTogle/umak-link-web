"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { PhotoProvider } from "react-photo-view";
import { parseReasonForReporting } from "@/lib/parse-reason-for-reporting";
import { normalizeValue } from "@/lib/format-utils";
import { useFraudReportDetail } from "@/hooks/queries/fraud-report-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLostItemLookup } from "@/hooks/queries/post-queries";
import { sendNotification } from "@/services/notifications-service";
import { deleteFraudReport, resolveFraudReport, updateFraudReportStatus } from "@/services/fraud-reports-service";
import {
  FraudReportHeader,
  FraudReportMainPanel,
  FraudReportModals,
  FraudReportSidebar,
} from "@/components/staff/fraud-report-detail-view-sections";
import { fraudReportDetailUiReducer } from "@/components/staff/fraud-report-detail-view-state";
import type { ToastTone } from "@/types/ui";

const REJECT_REASONS = [
  "Reporter has insufficient evidence.",
  "Original Claim was verified as legitimate.",
  "Item misidentification.",
  "This is a spam or malicious report.",
  "The report is duplicated.",
] as const;

function getStatusBadgeClass(status: string): string {
  const normalized = normalizeValue(status);
  if (normalized === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (normalized === "open") return "border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function FraudReportDetailView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const reportQuery = useFraudReportDetail(reportId);
  const report = reportQuery.data ?? null;
  const linkedMissingItemQuery = useLostItemLookup(report?.linked_lost_item_id ?? "");
  const linkedMissingItem = report?.linked_lost_item_id && linkedMissingItemQuery.data ? linkedMissingItemQuery.data : null;
  const [ui, dispatchUi] = useReducer(fraudReportDetailUiReducer, {
    isProcessing: false,
    toast: null,
    showAcceptModal: false,
    showRejectModal: false,
    showCloseChoiceModal: false,
    showDeleteModal: false,
    closeReportConfirmed: false,
  });

  const reportStatus = normalizeValue(report?.report_status ?? "under_review");
  const { reason, details } = parseReasonForReporting(report?.reason_for_reporting ?? report?.reason ?? "");
  const setToast = useCallback((message: string, tone: ToastTone) => {
    dispatchUi({ type: "set_toast", value: { message, tone } });
  }, []);

  useEffect(() => {
    if (!ui.toast) return;
    const timer = window.setTimeout(() => dispatchUi({ type: "set_toast", value: null }), 3000);
    return () => window.clearTimeout(timer);
  }, [ui.toast]);

  useEffect(() => {
    if (reportQuery.error) setToast("Failed to load fraud report", "danger");
  }, [reportQuery.error, setToast]);

  const navigateBackToList = () => {
    window.setTimeout(() => router.push("/staff/fraud-reports"), 1200);
  };

  const handleOpenReport = async () => {
    if (!report || ui.isProcessing) return;
    dispatchUi({ type: "set_processing", value: true });
    try {
      await updateFraudReportStatus(report.report_id, "open");
      if (report.reporter_id) {
        await Promise.allSettled([
          sendNotification({
            user_id: report.reporter_id,
            title: "Fraud Report Opened",
            body: `Your report on "${report.item_name ?? "Unknown Item"}" has been opened and is being investigated. Thank you for helping keep UMak-LINK safe.`,
            type: "acceptance",
          }),
        ]);
      }
      setToast("Fraud report opened", "success");
      navigateBackToList();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to open report", "danger");
    } finally {
      dispatchUi({ type: "set_processing", value: false });
      dispatchUi({ type: "set_modal", modal: "showAcceptModal", value: false });
    }
  };

  const handleRejectReport = async (reasonText: string) => {
    if (!report || ui.isProcessing) return;
    dispatchUi({ type: "set_processing", value: true });
    try {
      await updateFraudReportStatus(report.report_id, "rejected");
      if (report.reporter_id) {
        await Promise.allSettled([
          sendNotification({
            user_id: report.reporter_id,
            title: "Fraud Report Rejected",
            body: `Your report on "${report.item_name ?? "Unknown Item"}" has been rejected. Reason: ${reasonText}`,
            type: "rejection",
          }),
        ]);
      }
      setToast("Fraud report rejected successfully", "success");
      navigateBackToList();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to reject report", "danger");
    } finally {
      dispatchUi({ type: "set_processing", value: false });
      dispatchUi({ type: "set_modal", modal: "showRejectModal", value: false });
    }
  };

  const handleCloseReport = async (deleteClaim: boolean) => {
    if (!report || ui.isProcessing) return;
    dispatchUi({ type: "set_processing", value: true });
    try {
      await resolveFraudReport(report.report_id, deleteClaim);
      if (report.reporter_id) {
        await Promise.allSettled([
          sendNotification({
            user_id: report.reporter_id,
            title: deleteClaim ? "Report Resolved - Item Available" : "Report Resolved",
            body: deleteClaim
              ? `Your report on "${report.item_name ?? "Unknown Item"}" has been resolved. The item is now available for claiming again. Thank you for keeping UMak-LINK safe.`
              : `Your report on "${report.item_name ?? "Unknown Item"}" has been resolved. The staff decided not to retrieve the item from the claimer.`,
            type: deleteClaim ? "acceptance" : "info",
          }),
        ]);
      }
      setToast("Report closed successfully", "success");
      navigateBackToList();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to close report", "danger");
    } finally {
      dispatchUi({ type: "set_processing", value: false });
      dispatchUi({ type: "set_modal", modal: "showCloseChoiceModal", value: false });
      dispatchUi({ type: "set_close_report_confirmed", value: false });
    }
  };

  const handleDeleteReport = async () => {
    if (!report || ui.isProcessing) return;
    dispatchUi({ type: "set_processing", value: true });
    try {
      await deleteFraudReport(report.report_id);
      setToast("Report deleted successfully", "success");
      navigateBackToList();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to delete report", "danger");
    } finally {
      dispatchUi({ type: "set_processing", value: false });
      dispatchUi({ type: "set_modal", modal: "showDeleteModal", value: false });
    }
  };

  const closeReportChoices = linkedMissingItem
    ? [
        { label: "Yes, delete claim", description: "Delete the claim and set item as unclaimed. Linked missing item will reset to lost status.", deleteClaim: true },
        { label: "No, keep claim", description: "Keep the current claim and leave item status as claimed.", deleteClaim: false },
      ]
    : [
        { label: "Yes, delete claim", description: "Delete the claim and set item as unclaimed.", deleteClaim: true },
        { label: "No, keep claim", description: "Keep the current claim and leave item status as claimed.", deleteClaim: false },
      ];

  const canOpenReport = reportStatus === "under_review";
  const canRejectReport = reportStatus === "under_review";
  const canCloseReport = reportStatus === "open" && user?.user_id === report?.fraud_reviewer_id;
  const canDeleteReport = reportStatus === "rejected";

  if (reportQuery.isLoading) {
    return <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="h-5 w-56 animate-pulse rounded-full bg-slate-200" /><div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" /></div><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="h-6 w-64 animate-pulse rounded-full bg-slate-200" /><div className="mt-4 h-56 animate-pulse rounded-2xl bg-slate-100" /></div></section>;
  }
  if (!report) {
    return <section className="grid h-full min-h-0 grid-cols-1 place-items-center gap-4 overflow-y-auto pr-1"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">No report found</h1></div></section>;
  }

  return (
    <PhotoProvider>
      <section className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1">
        <FraudReportHeader report={report} getStatusBadgeClass={getStatusBadgeClass} onBack={() => router.push("/staff/fraud-reports")} />
        <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
          <FraudReportMainPanel
            report={report}
            reason={reason}
            details={details}
            linkedMissingItem={linkedMissingItem}
            canOpenReport={canOpenReport}
            canRejectReport={canRejectReport}
            canCloseReport={canCloseReport}
            canDeleteReport={canDeleteReport}
            closeReportConfirmed={ui.closeReportConfirmed}
            isProcessing={ui.isProcessing}
            onViewPostRecord={() => router.push(`/staff/post-record/view/${report.post_id}`)}
            onViewLinkedItem={() => linkedMissingItem && router.push(`/staff/post-record/view/${linkedMissingItem.post_id}`)}
            onOpen={() => dispatchUi({ type: "set_modal", modal: "showAcceptModal", value: true })}
            onReject={() => dispatchUi({ type: "set_modal", modal: "showRejectModal", value: true })}
            onToggleCloseConfirmed={(checked) => dispatchUi({ type: "set_close_report_confirmed", value: checked })}
            onClose={() => dispatchUi({ type: "set_modal", modal: "showCloseChoiceModal", value: true })}
            onDelete={() => dispatchUi({ type: "set_modal", modal: "showDeleteModal", value: true })}
          />
          <FraudReportSidebar report={report} reportStatus={reportStatus} />
        </div>
        <FraudReportModals
          showAcceptModal={ui.showAcceptModal}
          showRejectModal={ui.showRejectModal}
          showCloseChoiceModal={ui.showCloseChoiceModal}
          showDeleteModal={ui.showDeleteModal}
          isProcessing={ui.isProcessing}
          rejectReasons={REJECT_REASONS}
          closeReportChoices={closeReportChoices}
          onCancelAccept={() => dispatchUi({ type: "set_modal", modal: "showAcceptModal", value: false })}
          onConfirmAccept={() => void handleOpenReport()}
          onCancelReject={() => dispatchUi({ type: "set_modal", modal: "showRejectModal", value: false })}
          onReject={(reasonText) => void handleRejectReport(reasonText)}
          onCancelCloseChoice={() => dispatchUi({ type: "set_modal", modal: "showCloseChoiceModal", value: false })}
          onConfirmCloseChoice={(deleteClaim) => void handleCloseReport(deleteClaim)}
          onCancelDelete={() => dispatchUi({ type: "set_modal", modal: "showDeleteModal", value: false })}
          onConfirmDelete={() => void handleDeleteReport()}
        />
        {ui.toast ? <div className={`fixed right-6 top-6 z-[60] rounded-2xl px-4 py-2 text-sm text-white shadow-lg ${ui.toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>{ui.toast.message}</div> : null}
      </section>
    </PhotoProvider>
  );
}
