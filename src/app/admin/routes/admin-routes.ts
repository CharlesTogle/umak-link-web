import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileClock,
  UserCog,
  Megaphone,
} from "lucide-react";

export interface AdminRouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const adminPrimaryRoutes: AdminRouteItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "User Management", href: "/admin/admin-management", icon: UserCog },
  { label: "Audit Log", href: "/admin/audit-log", icon: FileClock },
  { label: "Announcements", href: "/admin/announcement", icon: Megaphone },
];
