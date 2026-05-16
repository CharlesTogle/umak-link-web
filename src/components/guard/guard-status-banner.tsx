interface GuardStatusBannerProps {
  tone: "success" | "warning";
  title: string;
  description: string;
}

const toneClasses: Record<GuardStatusBannerProps["tone"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function GuardStatusBanner({
  tone,
  title,
  description,
}: GuardStatusBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-sm font-extrabold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
