import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffStatCard({
  title,
  value,
  onClick,
}: {
  title: string;
  value: number;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;

  return (
    <Card
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`gap-0 py-3 ${isClickable ? "cursor-pointer transition hover:shadow-md" : ""}`}
    >
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-3xl font-semibold leading-none text-slate-700">{value}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pt-0 text-base font-semibold text-slate-800">{title}</CardContent>
    </Card>
  );
}
