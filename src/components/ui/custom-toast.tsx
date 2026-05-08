export type CustomToastTone = "success" | "danger" | "info";

interface CustomToastProps {
  message: string;
  tone: CustomToastTone;
  mode?: "inline" | "floating";
  className?: string;
}

const toneStyles: Record<CustomToastTone, string> = {
  success: "border-[#8ED8B3] bg-[#DDEBE5] text-[#067C5A]",
  danger: "border-rose-300 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export function CustomToast({ message, tone, mode = "inline", className = "" }: CustomToastProps) {
  const baseClassName = `rounded-[24px] border px-4 py-3 text-sm shadow-sm ${toneStyles[tone]} ${className}`;
  const wrapperClassName =
    mode === "floating" ? "pointer-events-none fixed right-6 top-6 z-50 w-[min(92vw,360px)]" : "";

  return (
    <div className={wrapperClassName}>
      <div role="status" aria-live="polite" className={baseClassName}>
        {message}
      </div>
    </div>
  );
}

interface CustomToastStackProps {
  toasts: Array<{ id: string; message: string; tone: CustomToastTone }>;
  className?: string;
}

export function CustomToastStack({ toasts, className = "" }: CustomToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={`pointer-events-none fixed right-6 top-6 z-50 flex w-[min(92vw,360px)] flex-col gap-2 ${className}`}>
      {toasts.map((toast) => (
        <CustomToast key={toast.id} message={toast.message} tone={toast.tone} className="w-full" />
      ))}
    </div>
  );
}
