"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomToast } from "@/components/ui/custom-toast";
import {
  initialStaffSearchFilters,
  useStaffSearchResults,
  type StaffSearchFilters,
} from "@/hooks/queries/staff-search-queries";
import { sendNotification } from "@/services/notifications-service";
import { generateReverseImageQuery } from "@/services/search-service";
import type { PostRecord, PostRecordAction } from "@/types/post-record";
import type { SearchItemStatus, SearchPostStatus } from "@/types/search";
import {
  SearchControlsPanel,
  SearchResultsPanel,
} from "@/components/staff/staff-search-view-sections";

interface StaffSearchViewProps {
  autoSearchFromUrl?: boolean;
}

const itemStatusOptions: Array<{ label: string; value: SearchItemStatus }> = [
  { label: "Lost", value: "lost" },
  { label: "Unclaimed", value: "unclaimed" },
  { label: "Claimed", value: "claimed" },
  { label: "Returned", value: "returned" },
  { label: "Discarded", value: "discarded" },
];

const postStatusOptions: Array<{ label: string; value: SearchPostStatus }> = [
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Claimed", value: "claimed" },
  { label: "Returned", value: "returned" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toggleArrayValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function StaffSearchView({ autoSearchFromUrl = false }: StaffSearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSearchedQueryRef = useRef("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<StaffSearchFilters>(initialStaffSearchFilters);

  const urlQuery = (searchParams.get("q") ?? "").trim();
  const submittedQuery = autoSearchFromUrl ? urlQuery : "";

  const searchQuery = useStaffSearchResults(
    submittedQuery,
    filters,
    autoSearchFromUrl && submittedQuery.length > 0 && !isOffline
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const syncNetworkState = () => {
      setIsOffline(!window.navigator.onLine);
    };

    syncNetworkState();
    window.addEventListener("online", syncNetworkState);
    window.addEventListener("offline", syncNetworkState);

    return () => {
      window.removeEventListener("online", syncNetworkState);
      window.removeEventListener("offline", syncNetworkState);
    };
  }, []);

  useEffect(() => {
    if (!autoSearchFromUrl) return;
    setQuery(urlQuery);
  }, [autoSearchFromUrl, urlQuery]);

  useEffect(() => {
    if (!autoSearchFromUrl || !urlQuery) return;
    autoSearchedQueryRef.current = urlQuery;
  }, [autoSearchFromUrl, urlQuery]);

  const runSearchFromForm = async () => {
    const trimmed = query.trim();
    let effectiveQuery = trimmed;

    if (!trimmed && !selectedImage) {
      setToast({ message: "Enter a keyword or upload an image first.", tone: "danger" });
      return;
    }

    if (selectedImage) {
      setIsAnalyzingImage(true);
      try {
        const imageDataUrl = await fileToDataUrl(selectedImage);
        const imageResult = await generateReverseImageQuery({
          imageDataUrl,
          ...(trimmed ? { searchValue: trimmed } : {}),
        });

        if (!imageResult.success) {
          setToast({
            message: imageResult.message ?? "Image analysis failed. Please try again.",
            tone: "danger",
          });
          return;
        }

        effectiveQuery = imageResult.search_query.trim();
      } catch {
        setToast({
          message: "Failed to analyze the uploaded image. Please try again.",
          tone: "danger",
        });
        return;
      } finally {
        setIsAnalyzingImage(false);
      }
    }

    if (!effectiveQuery) {
      setToast({
        message: "No search keyword was generated from the image.",
        tone: "danger",
      });
      return;
    }

    const nextPath = `/staff/search/results?q=${encodeURIComponent(effectiveQuery)}`;
    router.push(nextPath);
  };

  const handleClear = () => {
    setQuery("");
    setFilters(initialStaffSearchFilters);
    setSelectedImage(null);
    setIsAnalyzingImage(false);
    autoSearchedQueryRef.current = "";
    if (autoSearchFromUrl) {
      router.replace("/staff/search/results");
    }
  };

  const handleRetry = () => {
    if (!autoSearchFromUrl || !submittedQuery) return;
    void searchQuery.refetch();
  };

  const handleAction = (action: PostRecordAction, record: PostRecord) => {
    if (action === "view" || action === "change-status") {
      router.push(`/staff/post-record/view/${record.postId}`);
      return;
    }

    if (action === "claim") {
      router.push(`/staff/post/claim/${record.postId}`);
      return;
    }

    if (action === "share") {
      const shareUrl = `${window.location.origin}/staff/post-record/view/${record.postId}`;
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => setToast({ message: "Link copied to clipboard", tone: "success" }))
        .catch(() => setToast({ message: "Failed to copy link", tone: "danger" }));
      return;
    }

    if (action === "copy-item-id") {
      if (!record.itemId) {
        setToast({ message: "Item ID is not available", tone: "danger" });
        return;
      }

      navigator.clipboard
        .writeText(record.itemId)
        .then(() => setToast({ message: "Item ID copied", tone: "success" }))
        .catch(() => setToast({ message: "Failed to copy Item ID", tone: "danger" }));
      return;
    }

    if (!record.posterId) {
      setToast({ message: "Owner is not available for notification", tone: "danger" });
      return;
    }

    sendNotification({
      user_id: record.posterId,
      title: "Great News! A Possible Match to Your Item",
      body: `We found items that may match your ${record.itemName}. Please proceed to the Security Office during office hours to verify.`,
      description: "Please proceed to the Security Office during office hours.",
      type: "match",
      data: { postId: record.postId, itemId: record.itemId },
      ...(record.imageUrl ? { image_url: record.imageUrl } : {}),
    })
      .then(() => setToast({ message: "Owner notified successfully", tone: "success" }))
      .catch(() => setToast({ message: "Failed to notify owner", tone: "danger" }));
  };

  const results = searchQuery.data ?? [];
  const errorMessage = searchQuery.error instanceof Error ? searchQuery.error.message : null;

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <SearchResultsPanel
        autoSearchFromUrl={autoSearchFromUrl}
        query={query}
        submittedQuery={submittedQuery}
        isOffline={isOffline}
        errorMessage={errorMessage}
        isLoading={searchQuery.isLoading}
        results={results}
        onRetry={handleRetry}
        onAction={handleAction}
      />
      <SearchControlsPanel
        query={query}
        filters={filters}
        selectedImage={selectedImage}
        isLoading={searchQuery.isLoading}
        isAnalyzingImage={isAnalyzingImage}
        itemStatusOptions={itemStatusOptions}
        postStatusOptions={postStatusOptions}
        onSubmit={(event) => {
          event.preventDefault();
          void runSearchFromForm();
        }}
        onQueryChange={setQuery}
        onImageChange={setSelectedImage}
        onCategoryChange={(value) => setFilters((current) => ({ ...current, category: value }))}
        onLocationChange={(value) => setFilters((current) => ({ ...current, locationLastSeen: value }))}
        onLastSeenDateChange={(value) => setFilters((current) => ({ ...current, lastSeenDate: value }))}
        onClaimFromDateChange={(value) => setFilters((current) => ({ ...current, claimFromDate: value }))}
        onClaimToDateChange={(value) => setFilters((current) => ({ ...current, claimToDate: value }))}
        onToggleItemStatus={(value) =>
          setFilters((current) => ({ ...current, itemStatuses: toggleArrayValue(current.itemStatuses, value) }))
        }
        onTogglePostStatus={(value) =>
          setFilters((current) => ({ ...current, postStatuses: toggleArrayValue(current.postStatuses, value) }))
        }
        onSortChange={(value) => setFilters((current) => ({ ...current, sort: value }))}
        onSortDirectionChange={(value) => setFilters((current) => ({ ...current, sortDirection: value }))}
        onClear={handleClear}
      />

      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
    </section>
  );
}
