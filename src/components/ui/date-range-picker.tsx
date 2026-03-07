"use client";

import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
  disabled = false,
}: DateRangePickerProps) {
  const hasDateRange = fromDate || toDate;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300">
        <Calendar className="size-4 shrink-0 text-slate-400" />
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <label htmlFor="from-date" className="text-xs text-slate-500">
              From
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              max={toDate || undefined}
              disabled={disabled}
              className="w-[130px] border-none bg-transparent text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col">
            <label htmlFor="to-date" className="text-xs text-slate-500">
              To
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              min={fromDate || undefined}
              disabled={disabled}
              className="w-[130px] border-none bg-transparent text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>
      {hasDateRange && !disabled && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          className="shrink-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Clear date range"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
