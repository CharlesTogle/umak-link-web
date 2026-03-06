function bitsToHex(bits: number[]): string {
  const chunks: string[] = [];

  for (let index = 0; index < bits.length; index += 4) {
    const nibble =
      ((bits[index] ?? 0) << 3) |
      ((bits[index + 1] ?? 0) << 2) |
      ((bits[index + 2] ?? 0) << 1) |
      (bits[index + 3] ?? 0);
    chunks.push(nibble.toString(16));
  }

  return chunks.join("");
}

export async function computeBlockHash64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Unable to create canvas context");
    }

    context.drawImage(bitmap, 0, 0, 8, 8);
    const data = context.getImageData(0, 0, 8, 8).data;

    const values: number[] = [];
    for (let index = 0; index < data.length; index += 4) {
      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      values.push(gray);
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const bits = values.map((value) => (value >= average ? 1 : 0));

    return bitsToHex(bits).padStart(16, "0").slice(0, 16);
  } finally {
    bitmap.close();
  }
}
