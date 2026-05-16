import { formatDateTimeInPhilippineTime, toTimestampMillis } from "@/lib/date-time-helpers";
import { escapeCsvCell } from "@/lib/csv-utils";
import type { Announcement } from "@/services/announcements-service";

export type AnnouncementSortType = "newest" | "oldest";
export type AnnouncementMediaFilter = "all" | "with-image" | "no-image";

function getPhilippineDayStartMillis(value: string): number {
  return toTimestampMillis(`${value}T00:00:00`);
}

function getPhilippineDayEndMillis(value: string): number {
  return toTimestampMillis(`${value}T23:59:59.999`);
}

export function filterAnnouncements(
  announcements: Announcement[],
  startDate: string,
  endDate: string,
  mediaFilter: AnnouncementMediaFilter
): Announcement[] {
  return announcements.filter((announcement) => {
    const createdAtMillis = toTimestampMillis(announcement.created_at);

    if (createdAtMillis > 0) {
      if (startDate && createdAtMillis < getPhilippineDayStartMillis(startDate)) {
        return false;
      }

      if (endDate && createdAtMillis > getPhilippineDayEndMillis(endDate)) {
        return false;
      }
    }

    if (mediaFilter === "with-image" && !announcement.image_url) {
      return false;
    }

    if (mediaFilter === "no-image" && announcement.image_url) {
      return false;
    }

    return true;
  });
}

export function sortAnnouncements(
  announcements: Announcement[],
  sortType: AnnouncementSortType
): Announcement[] {
  const sorted = [...announcements];

  sorted.sort((firstAnnouncement, secondAnnouncement) => {
    const firstTimestamp = toTimestampMillis(firstAnnouncement.created_at);
    const secondTimestamp = toTimestampMillis(secondAnnouncement.created_at);

    return sortType === "oldest"
      ? firstTimestamp - secondTimestamp
      : secondTimestamp - firstTimestamp;
  });

  return sorted;
}

export function buildAnnouncementsCsv(announcements: Announcement[]): string {
  const headers = [
    "Announcement ID",
    "Created At (PHT)",
    "Created At (ISO)",
    "Message",
    "Description",
    "Has Image",
    "Image URL",
  ];

  const rows = announcements.map((announcement) => [
    announcement.id,
    formatDateTimeInPhilippineTime(announcement.created_at, "Unknown"),
    announcement.created_at,
    announcement.message,
    announcement.description ?? "",
    announcement.image_url ? "Yes" : "No",
    announcement.image_url ?? "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvCell(value)).join(","))
    .join("\n");
}

export function buildAnnouncementsCsvFileName(now = new Date()): string {
  const timestamp = now.toISOString().replaceAll(":", "-");
  return `announcements-${timestamp}.csv`;
}
