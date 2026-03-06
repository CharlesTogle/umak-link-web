import { FraudReportDetailView } from "@/components/staff/fraud-report-detail-view";

export default async function StaffFraudReportViewPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <FraudReportDetailView reportId={reportId} />;
}
