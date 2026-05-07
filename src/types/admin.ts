import type { PortalUserType } from "@/types/auth";

export interface DashboardStats {
  pending_verifications: number;
  pending_fraud_reports: number;
  claimed_count: number;
  unclaimed_count: number;
  to_review_count: number;
  lost_count: number;
  returned_count: number;
  reported_count: number;
}

export interface WeeklyStatsData {
  weeks: string[];
  series: {
    missing: number[];
    found: number[];
    reports: number[];
    pending: number[];
  };
}

export interface ExportRow {
  poster_name: string;
  item_name: string;
  item_description: string;
  last_seen_location: string;
  accepted_by_staff_name: string;
  submission_date: string;
  claimed_by_name: string;
  claimed_by_email: string;
  accepted_on_date: string;
}

export type DateRange = "today" | "week" | "month" | "year" | "all";

export interface AdminUserSearchResult {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url: string | null;
  user_type: PortalUserType;
}
