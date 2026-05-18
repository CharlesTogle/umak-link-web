import type { ReactNode } from "react";
import { RoleRouteGuard } from "@/components/auth/role-route-guard";
import { ResponsivePortalSidebar } from "@/components/layout/responsive-portal-sidebar";
import { NotificationToastWatcher } from "@/components/notifications/notification-toast-watcher";
import { StaffSidebar } from "@/components/staff/staff-sidebar";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRouteGuard allowedRoles={["Staff"]}>
      <div className="flex h-screen bg-[#eaf1f4]">
        <NotificationToastWatcher />
        <ResponsivePortalSidebar mobileTitle="Staff Portal">
          <StaffSidebar />
        </ResponsivePortalSidebar>
        <main className="h-screen flex-1 overflow-hidden p-4 pt-20 lg:pt-4 lg:pl-0">
          {children}
        </main>
      </div>
    </RoleRouteGuard>
  );
}
