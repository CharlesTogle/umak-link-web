import { create } from "zustand";
import { listFraudReports, resolveFraudReport, updateFraudReportStatus } from "@/services/fraud-reports-service";
import { mapFraudReport } from "@/lib/fraud-report-mappers";
import type { FraudReport } from "@/types/fraud-report";

interface StaffFraudReportsParams {
  sortDirection?: "asc" | "desc";
  pageSize?: number;
}

interface StaffFraudReportsStore {
  reports: FraudReport[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  pageSize: number;
  params: StaffFraudReportsParams;
  fetchReports: (params: StaffFraudReportsParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  openReport: (reportId: string, staffId?: string) => Promise<void>;
  rejectReport: (reportId: string, staffId?: string) => Promise<void>;
  resolveReport: (reportId: string) => Promise<void>;
}

export const useStaffFraudReportsStore = create<StaffFraudReportsStore>((set, get) => ({
  reports: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasMore: true,
  offset: 0,
  pageSize: 10,
  params: {},

  fetchReports: async (params) => {
    const pageSize = params.pageSize ?? get().pageSize;
    set({
      isLoading: true,
      error: null,
      offset: 0,
      hasMore: true,
      params,
      pageSize,
    });

    try {
      const response = await listFraudReports({
        limit: pageSize,
        offset: 0,
        sort: params.sortDirection ?? "desc",
      });
      const reports = response.reports.map(mapFraudReport);
      set({
        reports,
        isLoading: false,
        offset: reports.length,
        hasMore: reports.length === pageSize,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load fraud reports",
      });
    }
  },

  loadMore: async () => {
    const { isLoading, hasMore, offset, pageSize, params } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      const response = await listFraudReports({
        limit: pageSize,
        offset,
        sort: params.sortDirection ?? "desc",
      });
      const next = response.reports.map(mapFraudReport);
      set((state) => ({
        reports: [...state.reports, ...next],
        isLoading: false,
        offset: state.offset + next.length,
        hasMore: next.length === pageSize,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load fraud reports",
      });
    }
  },

  refresh: async () => {
    const { params } = get();
    set({ isRefreshing: true });
    await get().fetchReports(params);
    set({ isRefreshing: false });
  },

  openReport: async (reportId, staffId) => {
    await updateFraudReportStatus(reportId, "open", staffId);
    set((state) => ({
      reports: state.reports.map((report) =>
        report.reportId === reportId ? { ...report, reportStatus: "Open" } : report
      ),
    }));
  },

  rejectReport: async (reportId, staffId) => {
    await updateFraudReportStatus(reportId, "rejected", staffId);
    set((state) => ({
      reports: state.reports.map((report) =>
        report.reportId === reportId ? { ...report, reportStatus: "Rejected" } : report
      ),
    }));
  },

  resolveReport: async (reportId) => {
    await resolveFraudReport(reportId, false);
    set((state) => ({
      reports: state.reports.map((report) =>
        report.reportId === reportId ? { ...report, reportStatus: "Resolved" } : report
      ),
    }));
  },
}));
