import type { LucideIcon } from "lucide-react";

interface GuardPageSectionHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export function GuardPageSectionHeader({
  title,
  subtitle,
  icon: Icon,
}: GuardPageSectionHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#1D2981]/10">
          <Icon className="size-5 text-[#1D2981]" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-[#1D2981]">{title}</p>
          <p className="text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
