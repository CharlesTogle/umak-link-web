export type FraudReportStatus = "Under Review" | "Open" | "Rejected" | "Resolved";

export interface FraudReport {
  reportId: string;
  posterName: string | null;
  posterProfilePictureUrl: string | null;
  reporterName: string | null;
  reporterProfilePictureUrl: string | null;
  itemName: string | null;
  itemDescription: string | null;
  itemImageUrl: string | null;
  lastSeenAt: string | null;
  reasonForReporting: string | null;
  dateReported: string | null;
  reportStatus: FraudReportStatus;
}

export type FraudReportSortDirection = "desc" | "asc";

export interface FraudReportFilters {
  status: "all" | FraudReportStatus;
}

export type FraudReportAction = "view" | "open" | "reject" | "resolve";
