"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthStore } from "@/stores/auth-store";

export function StaffProfileView() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { user, isLoading } = useCurrentUser();

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  const profileName = useMemo(() => user?.user_name?.trim() || "Staff User", [user?.user_name]);
  const profileEmail = user?.email || "No email available";
  const profileRole = user?.user_type || "Staff";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 overflow-y-auto pb-4 pr-1">
      <div>
        <h1 className="text-3xl font-bold text-[#1D2981]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your account details.</p>
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
            <p className="text-lg font-semibold text-slate-900">{isLoading ? "Loading..." : profileName}</p>
            <p className="text-sm text-slate-600">{profileEmail}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{profileRole}</p>
          </div>
        </div>
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
