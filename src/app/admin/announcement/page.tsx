"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Plus, RefreshCw, Megaphone, Image as ImageIcon, Download } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomToast, type CustomToastTone } from "@/components/ui/custom-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { downloadCsvFile } from "@/lib/audit-log-utils";
import {
  buildAnnouncementsCsv,
  buildAnnouncementsCsvFileName,
  type AnnouncementMediaFilter,
  type AnnouncementSortType,
  filterAnnouncements,
  sortAnnouncements,
} from "@/lib/announcement-utils";
import { formatDateTimeInPhilippineTime } from "@/lib/date-time-helpers";
import { logError } from "@/lib/error-utils";
import { fetchAllAnnouncements, fetchAnnouncements, type Announcement } from "@/services/announcements-service";

const PAGE_SIZE = 30;

interface ToastState {
  message: string;
  tone: CustomToastTone;
}

export default function AdminAnnouncementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [displayAnnouncements, setDisplayAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Filter and sort states (initialized from URL)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortType, setSortType] = useState<AnnouncementSortType>("newest");
  const [hasImageFilter, setHasImageFilter] = useState<AnnouncementMediaFilter>("all");
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  const showToast = useCallback((message: string, tone: CustomToastTone) => {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Initialize state from URL on mount
  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sort = searchParams.get("sort");
    const image = searchParams.get("image");

    if (from) setStartDate(from);
    if (to) setEndDate(to);
    if (sort === "oldest" || sort === "newest") setSortType(sort);
    if (image === "with-image" || image === "no-image" || image === "all") {
      setHasImageFilter(image);
    }

    setIsInitialized(true);
  }, [searchParams]);

  // Update URL when filters or sort change
  const updateURL = useCallback(
    (from: string, to: string, sort: AnnouncementSortType, image: AnnouncementMediaFilter) => {
      const params = new URLSearchParams();

      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (sort !== "newest") params.set("sort", sort);
      if (image !== "all") params.set("image", image);

      const queryString = params.toString();
      const newUrl = queryString ? `?${queryString}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Sync URL when state changes (skip on initial load)
  useEffect(() => {
    if (!isInitialized) return;
    updateURL(startDate, endDate, sortType, hasImageFilter);
  }, [startDate, endDate, sortType, hasImageFilter, isInitialized, updateURL]);

  const loadAnnouncements = useCallback(async (currentOffset: number, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { announcements: data, count } = await fetchAnnouncements({
        limit: PAGE_SIZE,
        offset: currentOffset,
      });

      const newData = data ?? [];

      if (isInitial) {
        setAnnouncements(newData);
        setOffset(newData.length);
      } else {
        setAnnouncements((prev) => [...prev, ...newData]);
        setOffset(currentOffset + newData.length);
      }

      // Check if there are more items to load
      setHasMore(count ? currentOffset + newData.length < count : false);
    } catch (error) {
      logError("Error loading announcements", error);
      if (isInitial) setAnnouncements([]);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  // Load initial announcements
  useEffect(() => {
    if (!isInitialized) return;
    void loadAnnouncements(0, true);
  }, [isInitialized, loadAnnouncements]);

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    const filtered = filterAnnouncements(announcements, startDate, endDate, hasImageFilter);
    setDisplayAnnouncements(sortAnnouncements(filtered, sortType));
  }, [announcements, startDate, endDate, sortType, hasImageFilter]);

  const handleRefresh = () => {
    setExpandedId(null);
    void loadAnnouncements(0, true);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);

      const allAnnouncements = await fetchAllAnnouncements();
      const filteredAnnouncements = filterAnnouncements(
        allAnnouncements,
        startDate,
        endDate,
        hasImageFilter
      );
      const sortedAnnouncements = sortAnnouncements(filteredAnnouncements, sortType);
      const csvContent = buildAnnouncementsCsv(sortedAnnouncements);

      downloadCsvFile(csvContent, buildAnnouncementsCsvFileName());
      showToast(
        sortedAnnouncements.length > 0
          ? `Exported ${sortedAnnouncements.length} announcement${sortedAnnouncements.length === 1 ? "" : "s"} to CSV.`
          : "Exported an empty announcements CSV.",
        "success"
      );
    } catch (error) {
      logError("Failed to export announcements:", error);
      showToast("Failed to export announcements. Please try again.", "danger");
    } finally {
      setExporting(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      void loadAnnouncements(offset);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setHasImageFilter("all");
  };

  const goToForm = () => {
    router.push("/admin/generate-announcement");
  };

  // Infinite scroll
  const sentinelRef = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loadingMore,
    rootMargin: "200px",
  });

  const hasActiveFilters = startDate || endDate || hasImageFilter !== "all";

  // Image loading handlers
  const handleImageLoadStart = useCallback((announcementId: number) => {
    setLoadingImages((prev) => new Set(prev).add(announcementId));
  }, []);

  const handleImageLoadComplete = useCallback((announcementId: number) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(announcementId);
      return next;
    });
  }, []);

  // Track when images are expanded to start loading
  useEffect(() => {
    if (expandedId !== null) {
      const announcement = displayAnnouncements.find((a) => a.id === expandedId);
      if (announcement?.image_url) {
        handleImageLoadStart(expandedId);
      }
    }
  }, [expandedId, displayAnnouncements, handleImageLoadStart]);

  return (
    <PhotoProvider>
      <div className="h-full space-y-4">
        {toast && <CustomToast message={toast.message} tone={toast.tone} mode="floating" />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1D2981]">Announcements</h1>
            <p className="mt-1 text-sm text-slate-600">Create and manage system-wide announcements for all users.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCsv}
              size="sm"
              disabled={loading || exporting}
              className="bg-[#1D2981] text-white hover:bg-[#16206a]"
            >
              <Download className="mr-2 size-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading || exporting}>
              <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid h-[calc(100%-4rem)] min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column - Announcements List */}
          <div className="min-w-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
            {/* Create Announcement Card */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10">
                    <Megaphone className="size-6 text-[#1D2981]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[#1D2981]">Create Announcement</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Send notifications to all users about important updates or events
                    </p>
                    <Button
                      onClick={goToForm}
                      className="mt-4 bg-[#1D2981] hover:bg-[#1D2981]/90"
                      size="sm"
                    >
                      <Plus className="mr-2 size-4" />
                      Go to Announcement Form
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Announcements List */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="rounded-3xl border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-4 w-full max-w-lg" />
                        </div>
                        <Skeleton className="size-5 shrink-0 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayAnnouncements.length === 0 ? (
              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                <CardContent className="p-10 text-center">
                  <Megaphone className="mx-auto size-12 text-slate-300" />
                  <p className="mt-4 text-slate-600">
                    {hasActiveFilters ? "No announcements match your filters" : "No announcements found"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {hasActiveFilters
                      ? "Try adjusting your filters"
                      : "Create your first announcement to notify all users"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {displayAnnouncements.map((announcement) => {
                    const isExpanded = expandedId === announcement.id;
                    const truncatedMessage =
                      announcement.message && announcement.message.length > 100
                        ? `${announcement.message.substring(0, 100)}...`
                        : announcement.message;

                    return (
                      <Card key={announcement.id} className="rounded-3xl border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                        <CardContent className="p-0">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500">
                                  {formatDateTimeInPhilippineTime(announcement.created_at)}
                                </p>
                                {announcement.image_url && (
                                  <ImageIcon className="size-3 text-slate-400" />
                                )}
                              </div>
                              <p className="mt-1 font-semibold text-slate-900">{truncatedMessage}</p>
                            </div>
                            <ChevronDown
                              className={`size-5 shrink-0 text-[#1D2981] transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-200 bg-slate-50 p-4">
                              {announcement.image_url && (
                                <div className="mb-4">
                                  {loadingImages.has(announcement.id) && (
                                    <Skeleton className="aspect-video w-full rounded-lg" />
                                  )}
                                  <PhotoView src={announcement.image_url}>
                                    <div
                                      className={`cursor-zoom-in ${
                                        loadingImages.has(announcement.id) ? "hidden" : ""
                                      }`}
                                    >
                                      <img
                                        src={announcement.image_url}
                                        alt="announcement"
                                        className="aspect-video w-full rounded-lg object-cover"
                                        onLoadStart={() => handleImageLoadStart(announcement.id)}
                                        onLoad={() => handleImageLoadComplete(announcement.id)}
                                        onError={() => handleImageLoadComplete(announcement.id)}
                                      />
                                    </div>
                                  </PhotoView>
                                </div>
                              )}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">Title:</p>
                                  <p className="mt-1 text-sm text-slate-900">{announcement.message}</p>
                                </div>
                                {announcement.description && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500">Description:</p>
                                    <p className="mt-1 text-sm text-slate-900">
                                      {announcement.description}
                                    </p>
                                  </div>
                                )}
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
                {!hasMore && displayAnnouncements.length > 0 && (
                  <div className="py-4 text-center text-sm text-slate-500">
                    All announcements loaded
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Filters & Sorting */}
          <div className="min-w-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
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

            {/* Image Filter */}
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#1D2981]">Media</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setHasImageFilter("all")}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                      hasImageFilter === "all"
                        ? "border border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    All Announcements
                  </button>
                  <button
                    onClick={() => setHasImageFilter("with-image")}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                      hasImageFilter === "with-image"
                        ? "border border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    With Image
                  </button>
                  <button
                    onClick={() => setHasImageFilter("no-image")}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                      hasImageFilter === "no-image"
                        ? "border border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Text Only
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Clear Filters */}
            {hasActiveFilters && (
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
    </PhotoProvider>
  );
}
