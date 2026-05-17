import { api } from "@/lib/api";

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
