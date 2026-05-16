import jsQR from "jsqr";

interface BarcodeDetectorResultLike {
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResultLike[]>;
}

export async function attachMediaStreamToVideoElement(
  videoElement: HTMLVideoElement,
  stream: MediaStream
) {
  if (videoElement.srcObject !== stream) {
    videoElement.srcObject = stream;
  }

  await videoElement.play().catch(() => undefined);
}

export function hasReadableVideoFrame(videoElement: HTMLVideoElement) {
  return videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

function getOrCreateCanvas(canvasRef: { current: HTMLCanvasElement | null }) {
  if (!canvasRef.current) {
    canvasRef.current = document.createElement("canvas");
  }

  return canvasRef.current;
}

function decodeQrWithJsQr(
  videoElement: HTMLVideoElement,
  canvasRef: { current: HTMLCanvasElement | null }
) {
  const frameWidth = videoElement.videoWidth;
  const frameHeight = videoElement.videoHeight;

  if (!frameWidth || !frameHeight) {
    return null;
  }

  const canvas = getOrCreateCanvas(canvasRef);
  canvas.width = frameWidth;
  canvas.height = frameHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to read the camera preview.");
  }

  context.drawImage(videoElement, 0, 0, frameWidth, frameHeight);

  const imageData = context.getImageData(0, 0, frameWidth, frameHeight);
  const decodedQr = jsQR(imageData.data, frameWidth, frameHeight, {
    inversionAttempts: "dontInvert",
  });

  return decodedQr?.data?.trim() || null;
}

export async function readQrCodeFromVideoElement({
  barcodeDetector,
  canvasRef,
  videoElement,
}: {
  barcodeDetector: BarcodeDetectorLike | null;
  canvasRef: { current: HTMLCanvasElement | null };
  videoElement: HTMLVideoElement;
}) {
  if (barcodeDetector) {
    try {
      const detectedCodes = await barcodeDetector.detect(videoElement);
      const detectedValue = detectedCodes[0]?.rawValue?.trim() || null;

      if (detectedValue) {
        return detectedValue;
      }
    } catch {
      // Some browser BarcodeDetector implementations fail on early live frames.
      // Fall back to jsQR instead of tearing the camera stream down.
    }
  }

  return decodeQrWithJsQr(videoElement, canvasRef);
}
