"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Camera,
  HardDrive,
  ImageIcon,
  LogOut,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { CustomToast } from "@/components/ui/custom-toast";
import { UpdatePictureFromGoogleButton } from "@/components/profile/update-picture-from-google-button";
import { AI_AUTOFILL_RATE_LIMIT_KEY } from "@/lib/ai-autofill";
import { clearStaffSearchHistory } from "@/lib/staff-search-history";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthStore } from "@/stores/auth-store";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

interface ProfileViewProps {
  fallbackName: string;
  fallbackRole: string;
}

const PHOTOS_PERMISSION_KEY = "umak_link_web_photos_permission";

function getStatusChipClass(status: PermissionState): string {
  if (status === "granted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "denied") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "unsupported") {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getStatusLabel(status: PermissionState): string {
  if (status === "unsupported") return "Unsupported";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function readStoredPhotosPermission(): PermissionState {
  if (typeof window === "undefined") return "prompt";

  try {
    const storedValue = window.localStorage.getItem(PHOTOS_PERMISSION_KEY);
    if (
      storedValue === "granted" ||
      storedValue === "denied" ||
      storedValue === "prompt" ||
      storedValue === "unsupported"
    ) {
      return storedValue;
    }
  } catch {
    // Ignore browser storage failures.
  }

  return "prompt";
}

function writeStoredPhotosPermission(status: PermissionState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PHOTOS_PERMISSION_KEY, status);
  } catch {
    // Ignore browser storage failures.
  }
}

async function getCameraPermissionStatus(): Promise<PermissionState> {
  if (typeof navigator === "undefined") return "prompt";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";

  if (!navigator.permissions?.query) {
    return "prompt";
  }

  try {
    const result = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });

    if (result.state === "granted" || result.state === "denied") {
      return result.state;
    }

    return "prompt";
  } catch {
    return "prompt";
  }
}

function getNotificationsPermissionStatus(): PermissionState {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  return "prompt";
}

export function ProfileView({ fallbackName, fallbackRole }: ProfileViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { user, isLoading } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "danger";
  } | null>(null);
  const [permissions, setPermissions] = useState<{
    camera: PermissionState;
    photos: PermissionState;
    notifications: PermissionState;
  }>({
    camera: "prompt",
    photos: "prompt",
    notifications: "prompt",
  });

  useEffect(() => {
    let isActive = true;

    const loadPermissions = async () => {
      const nextCameraStatus = await getCameraPermissionStatus();
      const nextNotificationsStatus = getNotificationsPermissionStatus();
      const nextPhotosStatus = readStoredPhotosPermission();

      if (!isActive) return;

      setPermissions({
        camera: nextCameraStatus,
        photos: nextPhotosStatus,
        notifications: nextNotificationsStatus,
      });
    };

    void loadPermissions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: "success" | "danger") => {
    setToast({ message, tone });
  };

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  const handleClearCache = async () => {
    queryClient.clear();
    clearStaffSearchHistory();

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(AI_AUTOFILL_RATE_LIMIT_KEY);
      } catch {
        // Ignore browser storage failures.
      }
    }

    if (typeof caches !== "undefined") {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
    }

    showToast("All Caches cleared successfully.", "success");
  };

  const handleNotificationPermission = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Allow UMak Link to send you notifications?")
    ) {
      setPermissions((current) => ({ ...current, notifications: "denied" }));
      showToast("Notifications permission denied.", "danger");
      return;
    }

    if (typeof Notification === "undefined") {
      setPermissions((current) => ({ ...current, notifications: "unsupported" }));
      showToast("Notifications are not supported in this browser.", "danger");
      return;
    }

    const result = await Notification.requestPermission();
    const nextStatus: PermissionState =
      result === "granted" || result === "denied" ? result : "denied";

    setPermissions((current) => ({ ...current, notifications: nextStatus }));
    showToast(
      nextStatus === "granted"
        ? "Notifications permission granted."
        : "Notifications permission denied.",
      nextStatus === "granted" ? "success" : "danger"
    );
  };

  const handleCameraPermission = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Allow UMak Link to take pictures and record video?")
    ) {
      setPermissions((current) => ({ ...current, camera: "denied" }));
      showToast("Camera permission denied.", "danger");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissions((current) => ({ ...current, camera: "unsupported" }));
      showToast("Camera access is not supported in this browser.", "danger");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((current) => ({ ...current, camera: "granted" }));
      showToast("Camera permission granted.", "success");
    } catch {
      setPermissions((current) => ({ ...current, camera: "denied" }));
      showToast("Camera permission denied.", "danger");
    }
  };

  const handlePhotosPermission = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Allow UMak Link to access your photos?")
    ) {
      setPermissions((current) => ({ ...current, photos: "denied" }));
      writeStoredPhotosPermission("denied");
      showToast("Files and photos permission denied.", "danger");
      return;
    }

    const pickerWindow = window as Window & {
      showOpenFilePicker?: (options?: {
        multiple?: boolean;
        types?: Array<{
          description?: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<unknown[]>;
    };

    if (typeof pickerWindow.showOpenFilePicker === "function") {
      try {
        await pickerWindow.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Images",
              accept: {
                "image/*": [".png", ".jpg", ".jpeg", ".webp"],
              },
            },
          ],
        });
        setPermissions((current) => ({ ...current, photos: "granted" }));
        writeStoredPhotosPermission("granted");
        showToast("Files and photos permission granted.", "success");
      } catch {
        setPermissions((current) => ({ ...current, photos: "denied" }));
        writeStoredPhotosPermission("denied");
        showToast("Files and photos permission denied.", "danger");
      }
      return;
    }

    fileInputRef.current?.click();
  };

  const handlePhotosInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile) {
      setPermissions((current) => ({ ...current, photos: "granted" }));
      writeStoredPhotosPermission("granted");
      showToast("Files and photos permission granted.", "success");
    }

    event.target.value = "";
  };

  const profileName = user?.user_name?.trim() || fallbackName;
  const profileEmail = user?.email || "No email available";
  const profileRole = user?.user_type || fallbackRole;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 overflow-y-auto pb-4 pr-1">
      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}

      <div>
        <h1 className="text-3xl font-bold text-[#1D2981]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review your account details, permissions, cache, and session settings.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">User</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="size-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {user?.profile_picture_url ? (
              <Image
                src={user.profile_picture_url}
                alt={`${profileName} profile`}
                width={64}
                height={64}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <UserCircle2 className="size-full text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {isLoading ? "Loading..." : profileName}
            </p>
            <p className="text-sm text-slate-600">{profileEmail}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {profileRole}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-[#1D2981]" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
            <p className="text-sm text-slate-600">
              Manage browser permissions used by the portal.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <PermissionRow
            icon={<Camera className="size-4 text-[#1D2981]" />}
            label="Camera Permission"
            status={permissions.camera}
            buttonLabel="Request Camera Access"
            onClick={() => void handleCameraPermission()}
          />
          <PermissionRow
            icon={<ImageIcon className="size-4 text-[#1D2981]" />}
            label="Files/Photos Permission"
            status={permissions.photos}
            buttonLabel="Request File Access"
            onClick={() => void handlePhotosPermission()}
          />
          <PermissionRow
            icon={<Bell className="size-4 text-[#1D2981]" />}
            label="Notifications Permission"
            status={permissions.notifications}
            buttonLabel="Request Notifications Access"
            onClick={() => void handleNotificationPermission()}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UserCircle2 className="size-5 text-[#1D2981]" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile Picture</h2>
            <p className="text-sm text-slate-600">
              Sync your profile photo from your Google account.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <UpdatePictureFromGoogleButton />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <HardDrive className="size-5 text-[#1D2981]" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Clear Cache</h2>
            <p className="text-sm text-slate-600">
              Remove temporary files, image caches, and stored search data.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleClearCache()}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear All Cache
        </button>
      </div>

      <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotosInputChange}
        className="hidden"
      />
    </section>
  );
}

function PermissionRow(props: {
  icon: ReactNode;
  label: string;
  status: PermissionState;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-9 items-center justify-center rounded-full bg-white">
          {props.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{props.label}</p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusChipClass(
              props.status
            )}`}
          >
            {getStatusLabel(props.status)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={props.onClick}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        {props.buttonLabel}
      </button>
    </div>
  );
}
