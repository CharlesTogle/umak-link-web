import { api } from "@/lib/api";
import type { UserListResponse, PortalUserType } from "@/types/auth";
import type {
  DashboardStats,
  DateRange,
  ExportRow,
  WeeklyStatsData,
} from "@/types/admin";

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
