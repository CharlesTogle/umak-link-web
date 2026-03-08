"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, RefreshCw, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { fetchAuditLogs, type AuditLog } from "@/services/audit-logs-service";
import {
  formatActionType,
  getUniqueActionTypes,
  getUniqueUserNames,
  filterAuditLogs,
  sortAuditLogs,
} from "@/lib/audit-log-utils";

const LOGS_LIMIT = 20;

export default function AdminAuditLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [displayLogs, setDisplayLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter and sort states (initialized from URL)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortType, setSortType] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from URL on mount
  useEffect(() => {
    const filters = searchParams.get("filters");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sort = searchParams.get("sort");

    if (filters) {
      setActiveFilters(new Set(filters.split(",")));
    }
    if (from) {
      setStartDate(from);
    }
    if (to) {
      setEndDate(to);
    }
    if (sort === "oldest" || sort === "newest") {
      setSortType(sort);
    }

    setIsInitialized(true);
  }, [searchParams]);

  // Update URL when filters or sort change
  const updateURL = useCallback(
    (filters: Set<string>, from: string, to: string, sort: "newest" | "oldest") => {
      const params = new URLSearchParams();

      if (filters.size > 0) {
        params.set("filters", Array.from(filters).join(","));
      }
      if (from) {
        params.set("from", from);
      }
      if (to) {
        params.set("to", to);
      }
      if (sort !== "newest") {
        params.set("sort", sort);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `?${queryString}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Sync URL when state changes (skip on initial load)
  useEffect(() => {
    if (!isInitialized) return;
    updateURL(activeFilters, startDate, endDate, sortType);
  }, [activeFilters, startDate, endDate, sortType, isInitialized, updateURL]);

  // Load initial logs
  useEffect(() => {
    if (!isInitialized) return;
    loadAuditLogs(0, true);
  }, [isInitialized]);

  // Apply filters and sorting when data changes
  useEffect(() => {
    const filtered = filterAuditLogs(auditLogs, activeFilters, startDate, endDate);
    const sorted = sortAuditLogs(filtered, sortType);
    setDisplayLogs(sorted);
  }, [auditLogs, activeFilters, startDate, endDate, sortType]);

  const loadAuditLogs = async (currentOffset: number, isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const logs = await fetchAuditLogs({ limit: LOGS_LIMIT, offset: currentOffset });

      if (isRefresh) {
        setAuditLogs(logs);
        setOffset(logs.length);
      } else {
        const mergedIds = new Set(auditLogs.map((log) => log.audit_id));
        const uniqueLogs = [...auditLogs, ...logs.filter((log) => !mergedIds.has(log.audit_id))];
        setAuditLogs(uniqueLogs);
        setOffset(currentOffset + logs.length);
      }

      setHasMore(logs.length === LOGS_LIMIT);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setOffset(0);
    loadAuditLogs(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAuditLogs(offset);
    }
  };

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setStartDate("");
    setEndDate("");
  };

  const uniqueActionTypes = getUniqueActionTypes(auditLogs);
  const uniqueUserNames = getUniqueUserNames(auditLogs);

  // Infinite scroll
  const sentinelRef = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loadingMore,
    rootMargin: "200px", // Load more when 200px from bottom
  });

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-600">Track all system activities and user actions for security and compliance.</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid h-[calc(100%-4rem)] min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column - Audit Logs List */}
        <div className="space-y-4 overflow-y-auto pr-1 lg:col-span-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="rounded-3xl border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar Skeleton */}
                      <Skeleton className="size-10 shrink-0 rounded-full" />

                      {/* Content Skeleton */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-4 w-full max-w-md" />
                      </div>

                      {/* Icon Skeleton */}
                      <Skeleton className="size-5 shrink-0 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayLogs.length === 0 ? (
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-10 text-center">
                <p className="text-slate-600">
                  {activeFilters.size > 0 || startDate || endDate ? "No logs match your filters" : "No audit logs found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {displayLogs.map((log) => {
                  const isExpanded = expandedId === log.audit_id;
                  // Extract message from changes object or format action type
                  const message =
                    (typeof log.changes === 'object' && log.changes && 'message' in log.changes
                      ? (log.changes.message as string)
                      : null) || formatActionType(log.action);
                  const userName = log.user_table?.user_name || "Unknown User";
                  const userAvatar = log.user_table?.profile_picture_url;

                  return (
                    <Card key={log.audit_id} className="rounded-3xl border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                      <CardContent className="p-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.audit_id)}
                          className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50"
                        >
                          {/* Avatar */}
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            {userAvatar ? (
                              <img src={userAvatar} alt={userName} className="size-full object-cover" />
                            ) : (
                              <User className="size-5 text-slate-400" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500">
                              {new Date(log.timestamp).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">{message}</p>
                          </div>

                          {/* Expand Icon */}
                          <ChevronDown
                            className={`size-5 shrink-0 text-[#1D2981] transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 p-4">
                            {log.changes && typeof log.changes === "object" && (
                              <div className="space-y-2">
                                {Object.entries(log.changes)
                                  .filter(([key]) => key !== "message")
                                  .map(([key, value]) => (
                                    <div key={key} className="text-sm">
                                      <span className="font-semibold text-slate-900">
                                        {key
                                          .split("_")
                                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                          .join(" ")}
                                        :{" "}
                                      </span>
                                      <span className="text-slate-600">
                                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                            <div className="mt-3 text-xs text-slate-500">
                              <span className="font-semibold">Audit ID:</span> {log.audit_id}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Infinite Scroll Trigger & Loading */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="size-4 animate-spin rounded-full border-2 border-[#1D2981] border-t-transparent" />
                      Loading more...
                    </div>
                  )}
                </div>
              )}

              {/* End Message */}
              {!hasMore && displayLogs.length > 0 && (
                <div className="py-4 text-center text-sm text-slate-500">All audit logs loaded</div>
              )}
            </>
          )}
        </div>

        {/* Right Column - Filters & Sorting */}
        <div className="space-y-3 overflow-y-auto pr-1 lg:col-span-4">
          {/* Date Range Filter */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#1D2981]">Date Range</h3>
              <DateRangePicker
                fromDate={startDate}
                toDate={endDate}
                onFromDateChange={setStartDate}
                onToDateChange={setEndDate}
                onClear={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {/* Sort */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#1D2981]">Sort By</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSortType("newest")}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                    sortType === "newest"
                      ? "border border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortType("oldest")}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                    sortType === "oldest"
                      ? "border border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Action Type Filters */}
          {uniqueActionTypes.length > 0 && (
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#1D2981]">Action Type</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueActionTypes.map((type) => {
                    const filterKey = `action:${type.value}`;
                    const isActive = activeFilters.has(filterKey);
                    return (
                      <button
                        key={type.value}
                        onClick={() => toggleFilter(filterKey)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? "border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Name Filters */}
          {uniqueUserNames.length > 0 && (
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#1D2981]">User Name</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueUserNames.map((name) => {
                    const filterKey = `user:${name.value}`;
                    const isActive = activeFilters.has(filterKey);
                    return (
                      <button
                        key={name.value}
                        onClick={() => toggleFilter(filterKey)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? "border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {name.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clear Filters */}
          {(activeFilters.size > 0 || startDate || endDate) && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
