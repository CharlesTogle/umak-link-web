"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ResponsivePortalSidebarProps = {
  children: ReactNode;
  mobileTitle: string;
};

export function ResponsivePortalSidebar({
  children,
  mobileTitle,
}: ResponsivePortalSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center gap-3 px-4">
          <button
            type="button"
            aria-controls={drawerId}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((previous) => !previous)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.03em] text-slate-500">UMak-LINK</p>
            <p className="truncate text-sm font-semibold text-slate-900">{mobileTitle}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0",
            isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none lg:pointer-events-auto"
          )}
        >
          <div
            id={drawerId}
            onClickCapture={(event) => {
              const target = event.target;

              if (!(target instanceof HTMLElement)) return;
              if (target.closest("a[href]") || target.closest("[data-sidebar-close]")) {
                setIsOpen(false);
              }
            }}
          >
            {children}
          </div>
        </div>

        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed inset-0 z-30 bg-slate-900/45 transition-opacity lg:hidden",
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />
      </div>
    </>
  );
}
