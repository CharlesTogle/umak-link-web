import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RoleRouteGuard } from "@/components/auth/role-route-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRouteGuard allowedRoles={["Admin"]}>
      <div className="flex h-screen bg-[#f4f7ff]">
        <AdminSidebar />
        <main className="h-screen flex-1 overflow-auto p-6">{children}</main>
      </div>
    </RoleRouteGuard>
  );
}
