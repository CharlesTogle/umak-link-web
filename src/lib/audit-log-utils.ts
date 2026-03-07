import type { AuditLog } from "@/services/audit-logs-service";

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
    if (log.timestamp) {
      const logDate = new Date(log.timestamp);
      if (startDate) {
        const start = new Date(startDate);
        if (logDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (logDate > end) return false;
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
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;

    if (sortType === "oldest") {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });

  return sorted;
}
