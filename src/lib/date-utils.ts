import { logError } from "@/lib/error-utils";

/**
 * Convert UTC date to Philippine time (UTC+8)
 * @param utcDate - ISO string in UTC
 * @returns Formatted date string in Philippine time
 */
export function toPhilippineTime(utcDate: string | null): string {
  if (!utcDate) return "Never";

  try {
    const date = new Date(utcDate);

    // Convert to Philippine time (UTC+8)
    const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

    // Format as: "Jan 15, 2024 10:30 AM"
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return phTime.toLocaleString("en-US", options);
  } catch (error) {
    logError("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Convert UTC date to Philippine time (short format)
 * @param utcDate - ISO string in UTC
 * @returns Formatted date string in Philippine time (date only)
 */
export function toPhilippineDate(utcDate: string | null): string {
  if (!utcDate) return "N/A";

  try {
    const date = new Date(utcDate);

    // Convert to Philippine time (UTC+8)
    const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

    // Format as: "Jan 15, 2024"
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    return phTime.toLocaleString("en-US", options);
  } catch (error) {
    logError("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param utcDate - ISO string in UTC
 * @returns Relative time string
 */
export function getRelativeTime(utcDate: string | null): string {
  if (!utcDate) return "Never";

  try {
    const date = new Date(utcDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
    return `${diffYear} year${diffYear !== 1 ? "s" : ""} ago`;
  } catch (error) {
    logError("Error calculating relative time:", error);
    return "Unknown";
  }
}
