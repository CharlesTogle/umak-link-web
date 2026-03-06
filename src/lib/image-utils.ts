async function loadBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file);
}

function drawToCanvas(bitmap: ImageBitmap, maxEdge: number): HTMLCanvasElement {
  const { width, height } = bitmap;
  const scale = maxEdge / Math.max(width, height);
  const drawWidth = Math.round(width * Math.min(1, scale));
  const drawHeight = Math.round(height * Math.min(1, scale));

  const canvas = document.createElement("canvas");
  canvas.width = drawWidth;
  canvas.height = drawHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to create canvas context");
  }

  context.drawImage(bitmap, 0, 0, drawWidth, drawHeight);
  return canvas;
}

async function canvasToBlobWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("toBlob failed"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

export async function makeDisplay(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  try {
    const canvas = drawToCanvas(bitmap, 1600);
    return await canvasToBlobWebP(canvas, 0.82);
  } finally {
    bitmap.close();
  }
}
