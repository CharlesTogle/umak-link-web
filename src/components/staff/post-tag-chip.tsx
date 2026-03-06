import { cn } from "@/lib/utils";

type PostTagChipTone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneClasses: Record<PostTagChipTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  primary: "border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

export function PostTagChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: PostTagChipTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {label}
    </span>
  );
}
