import { api } from "@/lib/api";
import type { UserListResponse, PortalUserType } from "@/types/auth";

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

export async function fetchDashboardStats(dateRange: DateRange = "all"): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/admin/dashboard-stats", {
    params: { date_range: dateRange },
  });
  return data;
}

export async function fetchWeeklyStats(): Promise<WeeklyStatsData> {
  const { data } = await api.get<WeeklyStatsData>("/admin/stats/weekly");
  return data;
}

export async function fetchExportData(startDate: string, endDate: string): Promise<ExportRow[]> {
  const { data } = await api.get<{ rows: ExportRow[] }>(
    `/admin/stats/export?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
  );
  return data.rows;
}

/**
 * Fetch users by user type (Admin, Staff, or both)
 */
export async function fetchUsers(userTypes: PortalUserType[]): Promise<UserListResponse> {
  const { data } = await api.get<UserListResponse>("/admin/users", {
    params: { user_type: userTypes.join(",") },
  });
  return data;
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  userId: string,
  newRole: PortalUserType,
  previousRole?: PortalUserType
): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/admin/users/${userId}/role`, {
    role: newRole,
    previous_role: previousRole,
  });
  return data;
}

export interface UserSearchResult {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url: string | null;
  user_type: PortalUserType;
}

export interface UserSearchResponse {
  results: UserSearchResult[];
}

/**
 * Search for users (returns regular Users only by default)
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const { data } = await api.get<UserSearchResponse>("/users/search", {
    params: { query },
  });
  return data.results;
}
