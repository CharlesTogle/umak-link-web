import { api } from "@/lib/api";
import type { ApiFraudReportListResponse, ApiFraudReportPublic } from "@/types/fraud-report-api";

export async function listFraudReports(params: {
  limit?: number;
  offset?: number;
  exclude?: string[];
  ids?: string[];
  sort?: "asc" | "desc";
}): Promise<ApiFraudReportListResponse> {
  const { data } = await api.get<ApiFraudReportListResponse>("/fraud-reports", {
    params: {
      ...params,
      exclude: params.exclude?.join(","),
      ids: params.ids?.join(","),
    },
  });
  return data;
}

export async function updateFraudReportStatus(reportId: string, status: string) {
  const { data } = await api.put<{ success: boolean }>(`/fraud-reports/${reportId}/status`, { status });
  return data;
}

export async function resolveFraudReport(reportId: string, deleteClaim: boolean) {
  const { data } = await api.post<{ success: boolean; data: unknown }>(`/fraud-reports/${reportId}/resolve`, {
    delete_claim: deleteClaim,
  });
  return data;
}

export async function getFraudReport(reportId: string): Promise<ApiFraudReportPublic> {
  const { data } = await api.get<ApiFraudReportPublic>(`/fraud-reports/${reportId}`);
  return data;
}

export async function getFraudReportStatus(reportId: string): Promise<{ report_status: string }> {
  const { data } = await api.get<{ report_status: string }>(`/fraud-reports/${reportId}/status`);
  return data;
}

export async function deleteFraudReport(reportId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/fraud-reports/${reportId}`);
  return data;
}
