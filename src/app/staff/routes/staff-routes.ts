import type { LucideIcon } from "lucide-react";
import {
  House,
  FileText,
  ShieldAlert,
  Search,
  PlusSquare,
  Bell,
} from "lucide-react";

export type StaffRouteItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type StaffGroupItem = {
  label: string;
  href: string;
};

export type StaffRouteGroup = StaffRouteItem & {
  children?: StaffGroupItem[];
};

export const staffPrimaryRoutes: StaffRouteGroup[] = [
  {
    label: "Dashboard",
    href: "/staff",
    icon: House,
    children: [
      { label: "Lost Items", href: "/staff?type=lost" },
      { label: "Found Items", href: "/staff?type=found" },
    ],
  },
  {
    label: "Post Records",
    href: "/staff/post-records",
    icon: FileText,
    children: [
      { label: "All Records", href: "/staff/post-records?filter=all" },
      { label: "Pending", href: "/staff/post-records?filter=pending" },
      { label: "Claimed", href: "/staff/post-records?filter=claimed" },
      { label: "Archived", href: "/staff/post-records?filter=archived" },
    ],
  },
  { label: "Fraud Reports", href: "/staff/fraud-reports", icon: ShieldAlert },
  { label: "Search", href: "/staff/search", icon: Search },
  { label: "Create Post", href: "/staff/post/create", icon: PlusSquare },
];

export const staffSecondaryRoutes: StaffRouteItem[] = [
  { label: "Notifications", href: "/staff/notifications", icon: Bell },
];
