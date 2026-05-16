import type { ReactNode } from "react";

interface GuardSurfaceCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function GuardSurfaceCard({
  title,
  subtitle,
  children,
}: GuardSurfaceCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-base font-extrabold text-[#1D2981]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p>
        ) : null}
      </header>
      <div className="mb-4 h-px w-full bg-slate-200" />
      {children}
    </section>
  );
}
