"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { mapFraudReport } from "@/lib/fraud-report-mappers";
import { getFraudReport, listFraudReports } from "@/services/fraud-reports-service";
import type { FraudReportSortDirection } from "@/types/fraud-report";

const FRAUD_REPORTS_PAGE_SIZE = 10;

export const fraudReportKeys = {
  list: (sortDirection: FraudReportSortDirection, pageSize: number) =>
    ["fraud-reports", "list", sortDirection, pageSize] as const,
  detail: (reportId: string) => ["fraud-reports", "detail", reportId] as const,
};

export function useFraudReports(sortDirection: FraudReportSortDirection, pageSize = FRAUD_REPORTS_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: fraudReportKeys.list(sortDirection, pageSize),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await listFraudReports({
        limit: pageSize,
        offset: pageParam,
        sort: sortDirection,
      });

      return response.reports.map(mapFraudReport);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
  });
}

export function useFraudReportDetail(reportId: string) {
  return useQuery({
    queryKey: fraudReportKeys.detail(reportId),
    queryFn: () => getFraudReport(reportId),
    enabled: Boolean(reportId),
  });
}
