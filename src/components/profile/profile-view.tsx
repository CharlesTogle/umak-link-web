"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { HardDrive, LogOut, UserCircle2 } from "lucide-react";
import { CustomToast } from "@/components/ui/custom-toast";
import { AI_AUTOFILL_RATE_LIMIT_KEY } from "@/lib/ai-autofill";
import { clearStaffSearchHistory } from "@/lib/staff-search-history";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthStore } from "@/stores/auth-store";

interface ProfileViewProps {
  fallbackName: string;
  fallbackRole: string;
}

export function ProfileView({ fallbackName, fallbackRole }: ProfileViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { user, isLoading } = useCurrentUser();
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "danger";
  } | null>(null);

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

  const profileName = user?.user_name?.trim() || fallbackName;
  const profileEmail = user?.email || "No email available";
  const profileRole = user?.user_type || fallbackRole;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 overflow-y-auto pb-4 pr-1">
      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}

      <div>
        <h1 className="text-3xl font-bold text-[#1D2981]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review your account details, cache, and session settings.
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
    </section>
  );
}
