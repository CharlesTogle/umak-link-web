export function escapeCsvCell(value: unknown): string {
  const normalizedValue = value == null ? "" : String(value);
  const escapedValue = normalizedValue.replaceAll('"', '""');

  if (
    escapedValue.includes(",") ||
    escapedValue.includes('"') ||
    escapedValue.includes("\n")
  ) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
}

export function downloadCsvFile(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}
