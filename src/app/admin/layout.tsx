import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RoleRouteGuard } from "@/components/auth/role-route-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRouteGuard allowedRoles={["Admin"]}>
      <div className="flex h-screen bg-[#eaf1f4]">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-4 pl-0">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </RoleRouteGuard>
  );
}
