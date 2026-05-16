"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  attachMediaStreamToVideoElement,
  hasReadableVideoFrame,
  readQrCodeFromVideoElement,
} from "@/lib/media-stream-utils";
import { parseClaimQrPayload } from "@/lib/parse-claim-qr-payload";
import type {
  ClaimQrScanPayload,
  ClaimQrScannerPhase,
  ClaimQrScannerState,
} from "@/types/claim-verification";

export type { ClaimQrScannerState } from "@/types/claim-verification";

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

interface BarcodeDetectorConstructorLike {
  new (options?: BarcodeDetectorOptions): BarcodeDetectorLike;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructorLike;
  }
}

type ClaimQrScannerAction =
  | { type: "cameraClosed" }
  | { type: "cameraOpened" }
  | { type: "errorShown"; message: string }
  | { type: "scanningStarted"; message: string }
  | { type: "startupStarted"; message: string }
  | { type: "unsupportedShown"; message: string };

interface UseClaimQrScannerOptions {
  onDetected: (payload: ClaimQrScanPayload) => Promise<void>;
}

const CAMERA_IDLE_MESSAGE =
  "Open the camera and point it at the student claim QR. The claim form updates after the scan.";
const CAMERA_SCANNING_MESSAGE =
  "Hold the student claim QR inside the frame until the scan completes.";
const CAMERA_STARTING_MESSAGE = "Opening the camera...";
const CAMERA_UNSUPPORTED_MESSAGE =
  "Camera scanning is not available in this browser. Use the fallback option on this screen.";
const CAMERA_PERMISSION_MESSAGE =
  "Camera access was blocked. Allow camera access, then open the scanner again.";

const initialState: ClaimQrScannerState = {
  isOpen: false,
  message: CAMERA_IDLE_MESSAGE,
  phase: "idle",
};

function buildScannerState(
  phase: ClaimQrScannerPhase,
  isOpen: boolean,
  message: string
): ClaimQrScannerState {
  return {
    isOpen,
    message,
    phase,
  };
}

function scannerStateReducer(
  state: ClaimQrScannerState,
  action: ClaimQrScannerAction
): ClaimQrScannerState {
  switch (action.type) {
    case "cameraClosed":
      return buildScannerState("idle", false, CAMERA_IDLE_MESSAGE);
    case "cameraOpened":
      return buildScannerState("starting", true, CAMERA_STARTING_MESSAGE);
    case "errorShown":
      return buildScannerState("error", false, action.message);
    case "scanningStarted":
      return buildScannerState("scanning", true, action.message);
    case "startupStarted":
      return buildScannerState("starting", true, action.message);
    case "unsupportedShown":
      return buildScannerState("unsupported", false, action.message);
    default:
      return state;
  }
}

function supportsClaimCameraScan(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function getScannerErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return CAMERA_PERMISSION_MESSAGE;
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  return "Unable to scan the claim QR right now. Use the fallback option on this screen.";
}

export function useClaimQrScanner({ onDetected }: UseClaimQrScannerOptions) {
  const [state, dispatch] = useReducer(scannerStateReducer, initialState);
  const scanTimeoutRef = useRef<number | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const isDetectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const clearScanTimeout = useCallback(() => {
    if (scanTimeoutRef.current !== null) {
      window.clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const releaseCamera = useCallback(() => {
    clearScanTimeout();

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
    detectorRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    isDetectingRef.current = false;
  }, [clearScanTimeout]);

  const stopCamera = useCallback(() => {
    releaseCamera();
    dispatch({ type: "cameraClosed" });
  }, [releaseCamera]);

  const scheduleNextScan = useCallback(
    (runScan: () => Promise<void>) => {
      clearScanTimeout();
      scanTimeoutRef.current = window.setTimeout(() => {
        void runScan();
      }, 300);
    },
    [clearScanTimeout]
  );

  const setVideoElement = useCallback((videoElement: HTMLVideoElement | null) => {
    videoRef.current = videoElement;

    if (!videoElement || !streamRef.current) {
      return;
    }

    void attachMediaStreamToVideoElement(videoElement, streamRef.current);
  }, []);

  const openCamera = useCallback(async () => {
    if (streamRef.current) return;

    if (!supportsClaimCameraScan()) {
      dispatch({
        type: "unsupportedShown",
        message: CAMERA_UNSUPPORTED_MESSAGE,
      });
      return;
    }

    try {
      dispatch({
        type: "startupStarted",
        message: CAMERA_STARTING_MESSAGE,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }

      streamRef.current = stream;
      dispatch({ type: "cameraOpened" });

      const Detector = window.BarcodeDetector;
      detectorRef.current = Detector
        ? new Detector({
            formats: ["qr_code"],
          })
        : null;

      const detectQrCode = async () => {
        if (!isMountedRef.current || !streamRef.current) {
          return;
        }

        const videoElement = videoRef.current;

        if (!videoElement || isDetectingRef.current) {
          scheduleNextScan(detectQrCode);
          return;
        }

        if (!hasReadableVideoFrame(videoElement)) {
          scheduleNextScan(detectQrCode);
          return;
        }

        isDetectingRef.current = true;

        try {
          const rawValue = await readQrCodeFromVideoElement({
            barcodeDetector: detectorRef.current,
            canvasRef: scanCanvasRef,
            videoElement,
          });

          if (!rawValue) {
            scheduleNextScan(detectQrCode);
            return;
          }

          let payload: ClaimQrScanPayload;

          try {
            payload = parseClaimQrPayload(rawValue);
          } catch {
            scheduleNextScan(detectQrCode);
            return;
          }

          stopCamera();
          await onDetected(payload);
        } catch (error) {
          releaseCamera();
          dispatch({
            type: "errorShown",
            message: getScannerErrorMessage(error),
          });
        } finally {
          isDetectingRef.current = false;
        }
      };

      dispatch({
        type: "scanningStarted",
        message: CAMERA_SCANNING_MESSAGE,
      });
      scheduleNextScan(detectQrCode);
    } catch (error) {
      releaseCamera();
      dispatch({
        type: "errorShown",
        message: getScannerErrorMessage(error),
      });
    }
  }, [onDetected, releaseCamera, scheduleNextScan, stopCamera]);

  useEffect(() => {
    if (!state.isOpen || !streamRef.current || !videoRef.current) {
      return;
    }

    void attachMediaStreamToVideoElement(videoRef.current, streamRef.current);
  }, [state.isOpen, state.phase]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      releaseCamera();
    };
  }, [releaseCamera]);

  return {
    closeCamera: stopCamera,
    isSupported: supportsClaimCameraScan(),
    openCamera,
    state,
    videoRef: setVideoElement,
  };
}
