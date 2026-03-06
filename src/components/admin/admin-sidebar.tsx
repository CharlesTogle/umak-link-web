"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminPrimaryRoutes } from "@/app/admin/routes/admin-routes";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-[#1D2981]/15 bg-gradient-to-b from-[#1D2981] to-[#131a4f] p-5 text-white">
      <div className="mb-6 rounded-xl bg-white/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">UMak Link</p>
        <h2 className="text-xl font-bold">Admin Portal</h2>
      </div>

      <nav className="space-y-2 overflow-auto pr-1">
        {adminPrimaryRoutes.map((route) => {
          const active = isActive(pathname, route.href);
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-white text-[#1D2981]" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <route.icon className="size-4" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
