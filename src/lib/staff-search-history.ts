export const STAFF_SEARCH_HISTORY_KEY = "umak_link_web_staff_recent_searches";
const STAFF_SEARCH_HISTORY_LIMIT = 5;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readStaffSearchHistory(): string[] {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(STAFF_SEARCH_HISTORY_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, STAFF_SEARCH_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeStaffSearchHistory(searches: string[]): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      STAFF_SEARCH_HISTORY_KEY,
      JSON.stringify(searches.slice(0, STAFF_SEARCH_HISTORY_LIMIT))
    );
  } catch {
    // Ignore storage failures.
  }
}

export function addStaffSearchHistoryEntry(query: string): string[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return readStaffSearchHistory();

  const nextHistory = [
    normalizedQuery,
    ...readStaffSearchHistory().filter(
      (entry) => entry.toLowerCase() !== normalizedQuery.toLowerCase()
    ),
  ].slice(0, STAFF_SEARCH_HISTORY_LIMIT);

  writeStaffSearchHistory(nextHistory);
  return nextHistory;
}

export function removeStaffSearchHistoryEntry(query: string): string[] {
  const nextHistory = readStaffSearchHistory().filter(
    (entry) => entry.toLowerCase() !== query.trim().toLowerCase()
  );

  writeStaffSearchHistory(nextHistory);
  return nextHistory;
}

export function clearStaffSearchHistory(): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(STAFF_SEARCH_HISTORY_KEY);
  } catch {
    // Ignore storage failures.
  }
}
