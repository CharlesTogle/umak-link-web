import type { ReactNode } from "react";
import { GuardSidebar } from "@/components/guard/guard-sidebar";
import { RoleRouteGuard } from "@/components/auth/role-route-guard";
import { NotificationToastWatcher } from "@/components/notifications/notification-toast-watcher";

export default function GuardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRouteGuard allowedRoles={["Guard"]}>
      <div className="flex h-screen bg-[#eaf1f4]">
        <NotificationToastWatcher />
        <GuardSidebar />
        <main className="flex-1 overflow-y-auto p-4 pl-0">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </RoleRouteGuard>
  );
}
