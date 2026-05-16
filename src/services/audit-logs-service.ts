import { api } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

export interface AuditLog {
  audit_id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  changes: Record<string, unknown> | null;
  timestamp: string;
  timestamp_local?: string | null;
  user_table?: {
    user_id: string;
    user_name: string;
    email: string;
    profile_picture_url: string | null;
  };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
}

export interface FetchAuditLogsParams {
  limit?: number;
  offset?: number;
}

export async function fetchAuditLogs(params?: FetchAuditLogsParams): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLogsResponse>("/admin/audit-logs", { params });
  return data.logs;
}

export async function fetchAllAuditLogs(pageSize = 100): Promise<AuditLog[]> {
  const logs: AuditLog[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchAuditLogs({ limit: pageSize, offset });
    logs.push(...page);

    if (page.length < pageSize) {
      break;
    }

    offset += page.length;
  }

  return logs;
}

export async function fetchAuditLogById(logId: string): Promise<AuditLog> {
  const { data } = await api.get<AuditLog>(`/admin/audit-logs/${logId}`);
  return data;
}

export async function fetchAuditLogsByUser(
  userId: string,
  params?: { limit?: number; offset?: number }
): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLogsResponse>(`/admin/audit-logs/user/${userId}`, { params });
  return data.logs;
}

export async function fetchAuditLogsByAction(
  actionType: string,
  params?: { limit?: number; offset?: number }
): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLogsResponse>(`/admin/audit-logs/action/${actionType}`, { params });
  return data.logs;
}

export interface InsertAuditLogParams {
  user_id?: string;
  action: string;
  table_name: string;
  record_id: string;
  changes: Record<string, unknown>;
}

export async function insertAuditLog(params: InsertAuditLogParams): Promise<{ success: boolean; audit_id: string }> {
  const { data } = await api.post<{ success: boolean; audit_id: string }>("/admin/audit-logs", params);
  return data;
}

function getPortalLoginDestination(userType: AuthUser["user_type"]): string {
  if (userType === "Admin") return "admin portal";
  if (userType === "Guard") return "guard portal";
  return "staff portal";
}

export async function recordPortalLoginAudit(
  user: Pick<AuthUser, "user_id" | "user_name" | "email" | "user_type">
): Promise<{ success: boolean; audit_id: string }> {
  const displayName = user.user_name?.trim() || user.email?.trim() || user.user_id;

  return insertAuditLog({
    action: "account_login",
    table_name: "user_table",
    record_id: user.user_id,
    changes: {
      message: `${user.user_type} ${displayName} signed in to the ${getPortalLoginDestination(user.user_type)}`,
      login_source: "admin_staff_portal",
      user_type: user.user_type,
      user_name: user.user_name,
      user_email: user.email,
    },
  });
}
