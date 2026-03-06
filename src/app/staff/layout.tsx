import type { ReactNode } from "react";
import { RoleRouteGuard } from "@/components/auth/role-route-guard";
import { StaffSidebar } from "@/components/staff/staff-sidebar";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRouteGuard allowedRoles={["Staff"]}>
      <div className="flex h-screen bg-[#eaf1f4]">
        <StaffSidebar />
        <main className="h-screen flex-1 overflow-hidden p-4 pl-0">
          {children}
        </main>
      </div>
    </RoleRouteGuard>
  );
}
