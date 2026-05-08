import type { LucideIcon } from "lucide-react";
import {
  House,
  FileText,
  ShieldAlert,
  Search,
  PlusSquare,
} from "lucide-react";
import { buildPostRecordsSidebarHref } from "@/lib/post-record-filters";

export interface StaffRouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface StaffGroupItem {
  label: string;
  href: string;
}

export interface StaffRouteGroup extends StaffRouteItem {
  children?: StaffGroupItem[];
}

export const staffPrimaryRoutes: StaffRouteGroup[] = [
  {
    label: "Dashboard",
    href: "/staff",
    icon: House,
    children: [
      { label: "Missing Items", href: "/staff?type=lost" },
      { label: "Found Items", href: "/staff?type=found" },
    ],
  },
  {
    label: "Post Records",
    href: "/staff/post-records",
    icon: FileText,
    children: [
      { label: "All Records", href: buildPostRecordsSidebarHref("all") },
      { label: "Claimed", href: buildPostRecordsSidebarHref("claimed") },
      { label: "Unclaimed", href: buildPostRecordsSidebarHref("unclaimed") },
      { label: "Missing", href: buildPostRecordsSidebarHref("lost") },
    ],
  },
  { label: "Fraud Reports", href: "/staff/fraud-reports", icon: ShieldAlert },
  { label: "Search", href: "/staff/search", icon: Search },
  { label: "Create Post", href: "/staff/post/create", icon: PlusSquare },
];

export const staffSecondaryRoutes: StaffRouteItem[] = [];
