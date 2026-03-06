import { parseTimestamp } from "@/lib/date-time-helpers";

export function formatRelativeTime(value: string | null, hoursFallback = 0): string {
  const hoursFromFallback = Math.max(0, Math.floor(hoursFallback));

  if (!value) {
    return formatFromHours(hoursFromFallback);
  }

  const date = parseTimestamp(value);
  if (!date) {
    return formatFromHours(hoursFromFallback);
  }
  const diffMs = Date.now() - date.getTime();
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  return formatFromHours(hours);
}

function formatFromHours(hours: number): string {
  if (hours >= 24 * 30) {
    const months = Math.floor(hours / (24 * 30));
    return `${months} mo. ago`;
  }

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return `${hours} hr. ago`;
}
