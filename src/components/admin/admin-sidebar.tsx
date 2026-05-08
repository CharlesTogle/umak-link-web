"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CircleHelp, LogOut, UserCircle2 } from "lucide-react";
import { adminPrimaryRoutes } from "@/app/admin/routes/admin-routes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUnreadNotificationsCount } from "@/hooks/queries/notification-queries";
import { useAuthStore } from "@/stores/auth-store";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { user, isLoading } = useCurrentUser();
  const infoActive = isActive(pathname, "/admin/info");
  const unreadCountQuery = useUnreadNotificationsCount(user?.user_id ?? null);
  const unreadCount = unreadCountQuery.data?.unread_count ?? 0;
  const countLoading = unreadCountQuery.isLoading;

  const profileName = user?.user_name?.trim() || "Admin User";

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <aside className="m-4 flex h-[calc(100vh-2rem)] w-80 shrink-0">
      <div className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold tracking-[0.03em] text-slate-500" aria-label="UMak-LINK">
          UM<span className="lowercase">ak</span>-LINK
        </p>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Admin Portal</h2>

        <nav className="space-y-2 overflow-auto pr-1">
          {adminPrimaryRoutes.map((route) => {
            const active = isActive(pathname, route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-[#e9f4fb] font-medium text-[#1D2981]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <route.icon className="size-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-slate-200 pt-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {countLoading ? (
                <span className="inline-flex size-5 items-center justify-center">
                  <span className="size-3 animate-spin rounded-full border-2 border-[#4db8e5] border-t-transparent" />
                </span>
              ) : unreadCount > 0 ? (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#4db8e5] text-xs text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </div>
            <Link
              href="/admin/notifications"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <Bell className="size-4" />
                View Notifications
              </span>
            </Link>
          </div>

          <Link
            href="/admin/profile"
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <div className="size-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
              {user?.profile_picture_url ? (
                <Image
                  src={user.profile_picture_url}
                  alt={`${profileName} profile`}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <UserCircle2 className="size-full text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{isLoading ? "Loading..." : profileName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email ?? "No email available"}</p>
            </div>
          </Link>

          <Link
            href="/admin/info"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              infoActive ? "bg-[#e9f4fb] text-[#1D2981]" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <CircleHelp className="size-4" />
            <span>Info</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
