"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  fetchDashboardStats,
  fetchWeeklyStats,
  fetchExportData,
  type DashboardStats,
  type WeeklyStatsData,
  type DateRange,
} from "@/services/admin-service";

function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const filters: { label: string; value: DateRange }[] = [
    { label: "Today", value: "today" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === filter.value
              ? "bg-[#1D2981] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function WeeksFilter({
  value,
  onChange,
}: {
  value: number;
  onChange: (weeks: number) => void;
}) {
  const filters = [
    { label: "4 Weeks", value: 4 },
    { label: "8 Weeks", value: 8 },
    { label: "12 Weeks", value: 12 },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === filter.value
              ? "bg-[#1D2981] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  loading,
  color = "text-blue-700",
}: {
  title: string;
  value: number;
  loading: boolean;
  color?: string;
}) {
  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900 mb-2">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DonutChart({
  data,
  loading,
  onDownload,
}: {
  data: {
    claimed: number;
    unclaimed: number;
    lost: number;
    returned: number;
  };
  loading: boolean;
  onDownload: () => void;
}) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const total = data.claimed + data.unclaimed + data.lost + data.returned;
  const claimedPercent = total > 0 ? (data.claimed / total) * 100 : 0;
  const unclaimedPercent = total > 0 ? (data.unclaimed / total) * 100 : 0;
  const lostPercent = total > 0 ? (data.lost / total) * 100 : 0;
  const returnedPercent = total > 0 ? (data.returned / total) * 100 : 0;

  if (loading) {
    return (
      <div className="rounded-3xl w-full animate-pulse">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-28 bg-gray-300 rounded" />
          <div className="h-8 w-32 bg-gray-200 rounded border border-gray-300" />
        </div>
        <div className="flex flex-row items-center justify-evenly gap-3">
          <div className="w-[160px] h-[180px] flex items-center justify-center">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full border-[28px] border-gray-200" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl w-full">
      <div className="flex flex-col md:flex-row items-center justify-evenly gap-6">
        <div className="relative w-[200px] h-[200px]">
          <svg viewBox="0 0 200 200" className="transform -rotate-90">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="40" />
            {total > 0 && (
              <>
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="40"
                  strokeDasharray={`${(claimedPercent / 100) * 502.65} 502.65`}
                  strokeDashoffset="0"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  style={{ opacity: hoveredSlice && hoveredSlice !== "claimed" ? 0.4 : 1 }}
                  onMouseEnter={() => setHoveredSlice("claimed")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="40"
                  strokeDasharray={`${(unclaimedPercent / 100) * 502.65} 502.65`}
                  strokeDashoffset={`-${(claimedPercent / 100) * 502.65}`}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  style={{ opacity: hoveredSlice && hoveredSlice !== "unclaimed" ? 0.4 : 1 }}
                  onMouseEnter={() => setHoveredSlice("unclaimed")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="40"
                  strokeDasharray={`${(lostPercent / 100) * 502.65} 502.65`}
                  strokeDashoffset={`-${((claimedPercent + unclaimedPercent) / 100) * 502.65}`}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  style={{ opacity: hoveredSlice && hoveredSlice !== "lost" ? 0.4 : 1 }}
                  onMouseEnter={() => setHoveredSlice("lost")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="40"
                  strokeDasharray={`${(returnedPercent / 100) * 502.65} 502.65`}
                  strokeDashoffset={`-${((claimedPercent + unclaimedPercent + lostPercent) / 100) * 502.65}`}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  style={{ opacity: hoveredSlice && hoveredSlice !== "returned" ? 0.4 : 1 }}
                  onMouseEnter={() => setHoveredSlice("returned")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-700">{total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs font-medium text-slate-700">
          <div
            className="flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 rounded px-2 py-1 -mx-2"
            onMouseEnter={() => setHoveredSlice("claimed")}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-[#16a34a]" />
            <span>Claimed ({data.claimed})</span>
            <span className="ml-auto text-slate-500">{claimedPercent.toFixed(1)}%</span>
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 rounded px-2 py-1 -mx-2"
            onMouseEnter={() => setHoveredSlice("unclaimed")}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444]" />
            <span>Unclaimed ({data.unclaimed})</span>
            <span className="ml-auto text-slate-500">{unclaimedPercent.toFixed(1)}%</span>
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 rounded px-2 py-1 -mx-2"
            onMouseEnter={() => setHoveredSlice("lost")}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-[#6b7280]" />
            <span>Lost ({data.lost})</span>
            <span className="ml-auto text-slate-500">{lostPercent.toFixed(1)}%</span>
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 rounded px-2 py-1 -mx-2"
            onMouseEnter={() => setHoveredSlice("returned")}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-[#3b82f6]" />
            <span>Returned ({data.returned})</span>
            <span className="ml-auto text-slate-500">{returnedPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1D2981] hover:bg-[#1D2981]/5 transition-colors"
          aria-label="Download CSV"
        >
          <Download className="size-4" />
        </button>
      </div>
    </div>
  );
}

function LineChart({
  data,
  loading,
  onDownload,
  weeksToShow = 12,
}: {
  data: WeeklyStatsData;
  loading: boolean;
  onDownload: () => void;
  weeksToShow?: number;
}) {
  if (loading) {
    return (
      <div className="w-full rounded-3xl animate-pulse">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-300 rounded" />
        </div>
        <div className="w-full rounded-xl p-4">
          <div className="relative h-[260px] flex items-end">
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 w-6 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="flex-1 ml-10 relative h-full">
              <div className="absolute inset-0 flex flex-col justify-between pb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter data to show only the last N weeks
  const filteredData = {
    weeks: data.weeks.slice(-weeksToShow),
    series: {
      missing: data.series.missing.slice(-weeksToShow),
      found: data.series.found.slice(-weeksToShow),
      reports: data.series.reports.slice(-weeksToShow),
      pending: data.series.pending.slice(-weeksToShow),
    },
  };

  const maxValue = Math.max(
    ...filteredData.series.missing,
    ...filteredData.series.found,
    ...filteredData.series.reports,
    ...filteredData.series.pending,
    1
  );

  const trimmedData = (() => {
    let firstNonZeroIndex = -1;
    for (let idx = 0; idx < filteredData.weeks.length; idx++) {
      const anyNonZero =
        (filteredData.series.missing[idx] ?? 0) !== 0 ||
        (filteredData.series.found[idx] ?? 0) !== 0 ||
        (filteredData.series.reports[idx] ?? 0) !== 0 ||
        (filteredData.series.pending[idx] ?? 0) !== 0;
      if (anyNonZero) {
        firstNonZeroIndex = idx;
        break;
      }
    }

    if (firstNonZeroIndex > 0) {
      return {
        weeks: filteredData.weeks.slice(firstNonZeroIndex),
        series: {
          missing: filteredData.series.missing.slice(firstNonZeroIndex),
          found: filteredData.series.found.slice(firstNonZeroIndex),
          reports: filteredData.series.reports.slice(firstNonZeroIndex),
          pending: filteredData.series.pending.slice(firstNonZeroIndex),
        },
      };
    }
    return filteredData;
  })();

  if (trimmedData.weeks.length === 0) {
    return (
      <div className="w-full rounded-3xl p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-gray-500 text-center py-8">No data available yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl">
      <div className="w-full rounded-xl">
        <div className="relative h-[260px] p-4">
          <svg viewBox="0 0 800 260" className="w-full h-full">
            <defs>
              <linearGradient id="grid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f4f8ff" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={i}
                x1="50"
                y1={40 + i * 36}
                x2="750"
                y2={40 + i * 36}
                stroke="#e5edf9"
                strokeWidth="1"
              />
            ))}

            {trimmedData.weeks.map((week, i) => {
              const x = 50 + (i * 700) / Math.max(trimmedData.weeks.length - 1, 1);
              return (
                <text key={i} x={x} y="240" fontSize="11" fill="#6b7280" textAnchor="middle">
                  {week}
                </text>
              );
            })}

            {[0, 1, 2, 3, 4, 5].map((i) => {
              const value = Math.floor((maxValue * (5 - i)) / 5);
              return (
                <text key={i} x="40" y={40 + i * 36 + 4} fontSize="11" fill="#6b7280" textAnchor="end">
                  {value}
                </text>
              );
            })}

            {[
              { data: data.series.missing, color: "#df0020", label: "Missing" },
              { data: data.series.found, color: "#fe9a00", label: "Found" },
              { data: data.series.reports, color: "#8b5cf6", label: "Reports" },
              { data: data.series.pending, color: "#6b7280", label: "Pending" },
            ].map(({ data: seriesData, color }) => {
              const points = seriesData
                .map((value, i) => {
                  const x = 50 + (i * 700) / Math.max(seriesData.length - 1, 1);
                  const y = 220 - (value / maxValue) * 180;
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <polyline
                  key={color}
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-3 flex justify-start gap-4 items-center px-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#df0020]" />
            <span className="text-sm text-gray-800">Missing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#fe9a00]" />
            <span className="text-sm text-gray-800">Found</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#8b5cf6]" />
            <span className="text-sm text-gray-800">Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#6b7280]" />
            <span className="text-sm text-gray-800">Pending</span>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1D2981] hover:bg-[#1D2981]/5 transition-colors"
            aria-label="Download CSV"
          >
            <Download className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Validation helpers
  const validDateRanges: DateRange[] = ["today", "week", "month", "year", "all"];
  const validWeeks = [4, 8, 12];

  const validateDateRange = (value: string | null): DateRange => {
    if (value && validDateRanges.includes(value as DateRange)) {
      return value as DateRange;
    }
    return "all";
  };

  const validateWeeks = (value: string | null): number => {
    const parsed = parseInt(value || "12", 10);
    return validWeeks.includes(parsed) ? parsed : 12;
  };

  // Initialize state from URL params or defaults
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [itemReportStats, setItemReportStats] = useState<DashboardStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemReportLoading, setItemReportLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  const [statsDateRange, setStatsDateRange] = useState<DateRange>(
    validateDateRange(searchParams.get("stats"))
  );
  const [itemReportDateRange, setItemReportDateRange] = useState<DateRange>(
    validateDateRange(searchParams.get("itemReport"))
  );
  const [weeksToShow, setWeeksToShow] = useState<number>(
    validateWeeks(searchParams.get("weeks"))
  );

  // Helper function to update URL params
  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Wrapper functions that update both state and URL
  const handleStatsDateRangeChange = (range: DateRange) => {
    setStatsDateRange(range);
    updateUrlParams("stats", range);
  };

  const handleItemReportDateRangeChange = (range: DateRange) => {
    setItemReportDateRange(range);
    updateUrlParams("itemReport", range);
  };

  const handleWeeksToShowChange = (weeks: number) => {
    setWeeksToShow(weeks);
    updateUrlParams("weeks", weeks.toString());
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboardStats(statsDateRange);
        setStats(result);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statsDateRange]);

  useEffect(() => {
    const loadItemReport = async () => {
      try {
        setItemReportLoading(true);
        const result = await fetchDashboardStats(itemReportDateRange);
        setItemReportStats(result);
      } catch (err) {
        console.error("Error fetching item report stats:", err);
      } finally {
        setItemReportLoading(false);
      }
    };

    loadItemReport();
  }, [itemReportDateRange]);

  useEffect(() => {
    const loadWeekly = async () => {
      try {
        setWeeklyLoading(true);
        const result = await fetchWeeklyStats();
        setWeeklyStats(result);
      } catch (err) {
        console.error("Error fetching weekly stats:", err);
      } finally {
        setWeeklyLoading(false);
      }
    };

    loadWeekly();
  }, []);

  const handleDonutDownload = async () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    try {
      const rows = await fetchExportData(start.toISOString(), end.toISOString());

      const header = [
        "poster_name",
        "item_name",
        "item_description",
        "last_seen_location",
        "accepted_by_staff_name",
        "submission_date",
        "claimed_by_name",
        "claimed_by_email",
        "accepted_on_date",
      ].join(",");

      const csvRows = rows.map((r) => {
        const escaped = [
          r.poster_name,
          r.item_name,
          r.item_description,
          r.last_seen_location,
          r.accepted_by_staff_name,
          r.submission_date,
          r.claimed_by_name,
          r.claimed_by_email,
          r.accepted_on_date,
        ]
          .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
          .join(",");
        return escaped;
      });

      const csv = [header, ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `status-summary-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error generating CSV", e);
    }
  };

  const handleLineDownload = async () => {
    if (!weeklyStats) return;

    const end = new Date();
    const weeksShown = weeklyStats.weeks.length;
    const start = new Date();
    start.setDate(end.getDate() - weeksShown * 7);
    start.setHours(0, 0, 0, 0);

    try {
      const rows = await fetchExportData(start.toISOString(), end.toISOString());

      const header = [
        "poster_name",
        "item_name",
        "item_description",
        "last_seen_location",
        "accepted_by_staff_name",
        "submission_date",
        "claimed_by_name",
        "claimed_by_email",
        "accepted_on_date",
      ].join(",");

      const csvRows = rows.map((r) => {
        const escaped = [
          r.poster_name,
          r.item_name,
          r.item_description,
          r.last_seen_location,
          r.accepted_by_staff_name,
          r.submission_date,
          r.claimed_by_name,
          r.claimed_by_email,
          r.accepted_on_date,
        ]
          .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
          .join(",");
        return escaped;
      });

      const csv = [header, ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `system-stats-detailed-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error generating CSV", e);
    }
  };

  return (
    <section className="h-full overflow-y-auto pr-1 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-[#1D2981]">Dashboard</h1>
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Pending Items</h2>
            <DateRangeFilter value={statsDateRange} onChange={handleStatsDateRangeChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnalyticsCard
              title="Pending Verifications"
              value={stats?.pending_verifications ?? 0}
              loading={loading}
              color="text-blue-700"
            />
            <AnalyticsCard
              title="Pending Fraud Reports"
              value={stats?.pending_fraud_reports ?? 0}
              loading={loading}
              color="text-red-700"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-[#1D2981]">Item Status Report</h2>
            <DateRangeFilter value={itemReportDateRange} onChange={handleItemReportDateRangeChange} />
          </div>
          <DonutChart
            data={{
              claimed: itemReportStats?.claimed_count ?? 0,
              unclaimed: itemReportStats?.unclaimed_count ?? 0,
              lost: itemReportStats?.lost_count ?? 0,
              returned: itemReportStats?.returned_count ?? 0,
            }}
            loading={itemReportLoading}
            onDownload={handleDonutDownload}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-[#1D2981]">Post Status Trend</h2>
            <WeeksFilter value={weeksToShow} onChange={handleWeeksToShowChange} />
          </div>
          <LineChart
            data={weeklyStats ?? { weeks: [], series: { missing: [], found: [], reports: [], pending: [] } }}
            loading={weeklyLoading}
            onDownload={handleLineDownload}
            weeksToShow={weeksToShow}
          />
        </CardContent>
      </Card>
    </section>
  );
}
