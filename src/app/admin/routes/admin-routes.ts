import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  Megaphone,
  FileClock,
  Users,
  UserPlus,
  Sparkles,
} from "lucide-react";

export type AdminRouteItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const adminPrimaryRoutes: AdminRouteItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Dashboard Tab", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Audit Trail", href: "/admin/audit-trail", icon: FileClock },
  { label: "Staff Management", href: "/admin/staff-management", icon: Users },
  { label: "Announcements", href: "/admin/announcement", icon: Megaphone },
  { label: "Generate Announcement", href: "/admin/generate-announcement", icon: Sparkles },
  { label: "Add Staff", href: "/admin/staff/add", icon: UserPlus },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];
