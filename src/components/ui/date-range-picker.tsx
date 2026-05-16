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
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-slate-300">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
          <Calendar className="size-4 shrink-0 text-slate-400 md:mt-5" />
          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
            <div className="flex min-w-0 flex-col">
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
                className="w-full min-w-0 border-none bg-transparent text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="hidden h-8 w-px shrink-0 bg-slate-200 md:block" />
            <div className="flex min-w-0 flex-col">
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
                className="w-full min-w-0 border-none bg-transparent text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
      {hasDateRange && !disabled && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          className="shrink-0 self-end text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:self-auto"
          aria-label="Clear date range"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
