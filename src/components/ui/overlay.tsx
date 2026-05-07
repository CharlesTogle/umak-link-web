"use client";

import type { ReactNode } from "react";

export function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      {children}
    </div>
  );
}
