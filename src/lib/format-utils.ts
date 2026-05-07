export function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

export function toDisplayLabel(value: string | null | undefined, fallback = "Unknown"): string {
  if (!value) return fallback;

  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
