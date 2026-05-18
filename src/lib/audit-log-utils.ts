import type { AuditLog } from "@/services/audit-logs-service";
import { escapeCsvCell } from "@/lib/csv-utils";
import { formatDateTimeInPhilippineTime, toTimestampMillis } from "@/lib/date-time-helpers";

export { downloadCsvFile } from "@/lib/csv-utils";

/**
 * Format action type from snake_case to Title Case
 */
export function formatActionType(actionType: string | null): string {
  if (!actionType) return "Unknown Action";
  // Convert snake_case to Title Case
  return actionType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getAuditLogChanges(log: AuditLog): Record<string, unknown> {
  return log.changes && typeof log.changes === "object" ? log.changes : {};
}

function getAuditLogStringValue(log: AuditLog, key: string): string | null {
  const value = getAuditLogChanges(log)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getFraudReportAuditLabel(log: AuditLog): string | null {
  return (
    getAuditLogStringValue(log, "report_title") ??
    getAuditLogStringValue(log, "item_name") ??
    getAuditLogStringValue(log, "report_id")
  );
}

export function getAuditLogTimestampValue(log: AuditLog): string | null {
  if (typeof log.timestamp_local === "string" && log.timestamp_local.trim().length > 0) {
    return log.timestamp_local;
  }

  if (typeof log.timestamp === "string" && log.timestamp.trim().length > 0) {
    return log.timestamp;
  }

  return null;
}

function getPhilippineDayStartMillis(value: string): number {
  return toTimestampMillis(`${value}T00:00:00`);
}

function getPhilippineDayEndMillis(value: string): number {
  return toTimestampMillis(`${value}T23:59:59.999`);
}

export function getAuditLogMessage(log: AuditLog): string {
  if (log.action === "fraud_report_marked_open") {
    const userName = log.user_table?.user_name ?? "Staff";
    const reportLabel = getFraudReportAuditLabel(log);

    if (reportLabel) {
      return `${userName} opened fraud report ${reportLabel}`;
    }
  }

  const message = getAuditLogChanges(log).message;
  return typeof message === "string" && message.trim().length > 0
    ? message
    : formatActionType(log.action);
}

/**
 * Get unique action types from logs
 */
export function getUniqueActionTypes(logs: AuditLog[]): Array<{ label: string; value: string }> {
  const types = new Set(logs.map((log) => log.action).filter(Boolean));
  return Array.from(types).map((type) => ({
    label: formatActionType(type),
    value: type,
  }));
}

/**
 * Get unique user names from logs
 */
export function getUniqueUserNames(logs: AuditLog[]): Array<{ label: string; value: string }> {
  const names = new Set(
    logs.map((log) => log.user_table?.user_name).filter((name): name is string => Boolean(name))
  );
  return Array.from(names).map((name) => ({
    label: name || "Unknown",
    value: name || "",
  }));
}

/**
 * Parse filters with prefixes (action:, user:)
 */
export function parseFilters(filters: Set<string>): {
  actionTypes: Set<string>;
  userNames: Set<string>;
} {
  const actionTypes = new Set<string>();
  const userNames = new Set<string>();

  filters.forEach((filter) => {
    if (filter.startsWith("action:")) {
      actionTypes.add(filter.replace("action:", ""));
    } else if (filter.startsWith("user:")) {
      userNames.add(filter.replace("user:", ""));
    }
  });

  return { actionTypes, userNames };
}

/**
 * Filter logs by action type, user name, and date range
 */
export function filterAuditLogs(
  logs: AuditLog[],
  activeFilters: Set<string>,
  startDate: string,
  endDate: string
): AuditLog[] {
  const { actionTypes, userNames } = parseFilters(activeFilters);

  return logs.filter((log) => {
    // Filter by action type
    if (actionTypes.size > 0 && (!log.action || !actionTypes.has(log.action))) {
      return false;
    }

    // Filter by user names
    if (userNames.size > 0) {
      const userName = log.user_table?.user_name;
      if (!userName || !userNames.has(userName)) {
        return false;
      }
    }

    // Filter by date range
    const logTime = toTimestampMillis(getAuditLogTimestampValue(log));
    if (logTime > 0) {
      if (startDate) {
        if (logTime < getPhilippineDayStartMillis(startDate)) return false;
      }
      if (endDate) {
        if (logTime > getPhilippineDayEndMillis(endDate)) return false;
      }
    }

    return true;
  });
}

/**
 * Sort logs by timestamp
 */
export function sortAuditLogs(logs: AuditLog[], sortType: "newest" | "oldest"): AuditLog[] {
  const sorted = [...logs];

  sorted.sort((a, b) => {
    const timeA = toTimestampMillis(getAuditLogTimestampValue(a));
    const timeB = toTimestampMillis(getAuditLogTimestampValue(b));

    if (sortType === "oldest") {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });

  return sorted;
}

function getAuditLogDetailsJson(log: AuditLog): string {
  const details = { ...getAuditLogChanges(log) };
  delete details.message;
  return Object.keys(details).length > 0 ? JSON.stringify(details) : "";
}

export function buildAuditLogsCsv(logs: AuditLog[]): string {
  const headers = [
    "Audit ID",
    "Timestamp (PHT)",
    "Timestamp (ISO)",
    "Action",
    "User Name",
    "User Email",
    "User ID",
    "Table Name",
    "Record ID",
    "Message",
    "Details JSON",
  ];

  const rows = logs.map((log) => [
    log.audit_id,
    formatDateTimeInPhilippineTime(getAuditLogTimestampValue(log), "Unknown"),
    log.timestamp ?? getAuditLogTimestampValue(log) ?? "",
    log.action,
    log.user_table?.user_name ?? "",
    log.user_table?.email ?? "",
    log.user_id ?? "",
    log.table_name,
    log.record_id,
    getAuditLogMessage(log),
    getAuditLogDetailsJson(log),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvCell(value)).join(","))
    .join("\n");
}

export function buildAuditLogsCsvFileName(now = new Date()): string {
  const timestamp = now.toISOString().replaceAll(":", "-");
  return `audit-trail-${timestamp}.csv`;
}
