import type { LucideIcon } from "lucide-react";
import { ClipboardCheck, House, QrCode } from "lucide-react";

export interface GuardRouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const guardPrimaryRoutes: GuardRouteItem[] = [
  { label: "Home", href: "/guard", icon: House },
  { label: "Active Reviews", href: "/guard/active-reviews", icon: ClipboardCheck },
  { label: "Scan", href: "/guard/scan", icon: QrCode },
];
