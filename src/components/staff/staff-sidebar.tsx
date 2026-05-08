"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, ChevronDown, CircleHelp, LogOut, UserCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { staffPrimaryRoutes, staffSecondaryRoutes } from "@/app/staff/routes/staff-routes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUnreadNotificationsCount } from "@/hooks/queries/notification-queries";
import { getPostRecordFiltersFromSearchParams } from "@/lib/post-record-filters";
import { useAuthStore } from "@/stores/auth-store";

function isActive(pathname: string, href: string): boolean {
  if (href === "/staff") return pathname === "/staff";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isChildActive(pathname: string, searchParams: URLSearchParams, childHref: string): boolean {
  const url = new URL(childHref, "http://localhost");
  const childPath = url.pathname;
  const childSearchParams = url.searchParams;

  if (pathname !== childPath) return false;

  if (childPath === "/staff/post-records") {
    const currentFilters = getPostRecordFiltersFromSearchParams(searchParams);
    const childFilters = getPostRecordFiltersFromSearchParams(childSearchParams);

    return currentFilters.postStatus === childFilters.postStatus &&
      currentFilters.itemStatus === childFilters.itemStatus &&
      currentFilters.itemType === childFilters.itemType;
  }

  if (Array.from(childSearchParams.keys()).length === 0) {
    return searchParams.toString().length === 0;
  }

  for (const [key, value] of childSearchParams.entries()) {
    if (searchParams.get(key) !== value) return false;
  }

  return true;
}

export function StaffSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { user, isLoading } = useCurrentUser();
  const infoActive = isActive(pathname, "/staff/info");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Dashboard: true,
    "Post Records": true,
  });
  const unreadCountQuery = useUnreadNotificationsCount(user?.user_id ?? null);
  const unreadCount = unreadCountQuery.data?.unread_count ?? 0;
  const countLoading = unreadCountQuery.isLoading;

  const defaultGroupState = useMemo(
    () =>
      staffPrimaryRoutes.reduce<Record<string, boolean>>((acc, route) => {
        if (route.children?.length && openGroups[route.label] === undefined) acc[route.label] = false;
        return acc;
      }, {}),
    [openGroups]
  );

  const mergedOpenState = { ...defaultGroupState, ...openGroups };
  const profileName = user?.user_name?.trim() || "Staff User";

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
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Staff Navigation</h2>

        <nav className="space-y-2 overflow-auto pr-1">
          {staffPrimaryRoutes.map((route) => {
            const active = isActive(pathname, route.href);
            return (
              <div key={route.href} className="space-y-1">
                <div className="mr-2 flex items-center justify-between">
                  <Link
                    href={route.href}
                    className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active ? "bg-[#e9f4fb] font-medium text-[#1D2981]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <route.icon className="size-4" />
                    <span>{route.label}</span>
                  </Link>
                  {route.children?.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [route.label]: !mergedOpenState[route.label],
                        }))
                      }
                      className="ml-1 rounded-md p-1 text-slate-500 hover:bg-slate-100"
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${mergedOpenState[route.label] ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : null}
                </div>

                {route.children?.length && mergedOpenState[route.label] ? (
                  <div className="ml-5 space-y-1 border-l border-slate-200 pl-3">
                    {route.children.map((child) => {
                      const childActive = isChildActive(pathname, searchParams, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded-md px-2 py-1.5 text-sm transition ${
                            childActive
                              ? "bg-[#e9f4fb] font-medium text-[#1D2981]"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
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
              href="/staff/notifications"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <Bell className="size-4" />
                View Notifications
              </span>
            </Link>
          </div>

          <Link
            href="/staff/profile"
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

          {staffSecondaryRoutes.map((route) => {
            const active = isActive(pathname, route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-[#e9f4fb] text-[#1D2981]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <route.icon className="size-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}

          <Link
            href="/staff/info"
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
