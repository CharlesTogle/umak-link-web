export type Meridian = "AM" | "PM";

export interface DateTimeState {
  date: string;
  time: string;
  meridian: Meridian;
}

export const PHILIPPINE_TIMEZONE = "Asia/Manila";
const PHILIPPINE_UTC_OFFSET = "+08:00";

const HAS_EXPLICIT_OFFSET_PATTERN = /(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getDateTimeParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PHILIPPINE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const findPart = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value ?? "0";
    return Number(value);
  };

  return {
    year: findPart("year"),
    month: findPart("month"),
    day: findPart("day"),
    hour: findPart("hour"),
    minute: findPart("minute"),
  };
}

export function normalizeTimestampInput(value: string): string {
  if (HAS_EXPLICIT_OFFSET_PATTERN.test(value)) return value;
  if (DATE_ONLY_PATTERN.test(value)) return `${value}T00:00:00${PHILIPPINE_UTC_OFFSET}`;
  return `${value}${PHILIPPINE_UTC_OFFSET}`;
}

export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(normalizeTimestampInput(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function toTimestampMillis(value: string | null | undefined): number {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.getTime() : 0;
}

export function formatDateInPhilippineTime(
  value: string | null | undefined,
  fallback = "N/A"
): string {
  const parsed = parseTimestamp(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString("en-US", {
    timeZone: PHILIPPINE_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTimeInPhilippineTime(
  value: string | null | undefined,
  fallback = "Unknown"
): string {
  const parsed = parseTimestamp(value);
  if (!parsed) return fallback;
  return parsed.toLocaleString("en-US", {
    timeZone: PHILIPPINE_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function extractPhilippineDateTimeParts(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parsed = parseTimestamp(value);
  if (!parsed) {
    throw new Error("Invalid date/time value");
  }
  return getDateTimeParts(parsed);
}

export function initializeDateTimeState(): DateTimeState {
  const now = new Date();
  const parts = getDateTimeParts(now);
  let hours = parts.hour;
  const minutes = String(parts.minute).padStart(2, "0");
  const meridian: Meridian = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return {
    date: `${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")}/${parts.year}`,
    time: `${hours}:${minutes}`,
    meridian,
  };
}

export function toISODate(date: string, time: string, meridian: Meridian): string {
  const [month = "01", day = "01", year = "1970"] = date.split("/");
  const [parsedHours = 0, minutes = 0] = time.split(":").map((value) => Number(value));
  let hours = parsedHours;

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return `${(year ?? "1970")}-${(month ?? "01").padStart(2, "0")}-${(day ?? "01").padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+08:00`;
}
