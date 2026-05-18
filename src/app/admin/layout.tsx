import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RoleRouteGuard } from "@/components/auth/role-route-guard";
import { ResponsivePortalSidebar } from "@/components/layout/responsive-portal-sidebar";
import { NotificationToastWatcher } from "@/components/notifications/notification-toast-watcher";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRouteGuard allowedRoles={["Admin"]}>
      <div className="flex h-screen bg-[#eaf1f4]">
        <NotificationToastWatcher />
        <ResponsivePortalSidebar mobileTitle="Admin Portal">
          <AdminSidebar />
        </ResponsivePortalSidebar>
        <main className="flex-1 overflow-y-auto p-4 pt-20 lg:pt-4 lg:pl-0">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </RoleRouteGuard>
  );
}
