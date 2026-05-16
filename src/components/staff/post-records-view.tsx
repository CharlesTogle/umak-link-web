"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomToast } from "@/components/ui/custom-toast";
import { flattenInfinitePages, usePostRecords } from "@/hooks/queries/post-queries";
import { buildPostRecordsUrl, getPostRecordFiltersFromSearchParams } from "@/lib/post-record-filters";
import { shareLink } from "@/lib/share-link";
import { sendNotification } from "@/services/notifications-service";
import { notifyGuardForCustodyFollowUp } from "@/services/staff-custody-service";
import {
  PostRecordsFeed,
  PostRecordsNotifyModal,
  PostRecordsSidebar,
} from "@/components/staff/post-records-view-sections";
import type {
  PostRecord,
  PostRecordAction,
  PostRecordFilterKey,
  PostRecordFilters,
  PostRecordSortDirection,
} from "@/types/post-record";

const filterGroups: Array<{
  key: PostRecordFilterKey;
  label: string;
  options: Array<{ label: string; value: PostRecordFilters[PostRecordFilterKey] }>;
}> = [
  {
    key: "postStatus",
    label: "Post Status",
    options: [
      { label: "All", value: "all" },
      { label: "Pending", value: "Pending" },
      { label: "Accepted", value: "Accepted" },
      { label: "Rejected", value: "Rejected" },
    ],
  },
  {
    key: "itemStatus",
    label: "Item Status",
    options: [
      { label: "All", value: "all" },
      { label: "Claimed", value: "Claimed" },
      { label: "Unclaimed", value: "Unclaimed" },
      { label: "Lost", value: "Lost" },
      { label: "Returned", value: "Returned" },
    ],
  },
  {
    key: "itemType",
    label: "Item Type",
    options: [
      { label: "All", value: "all" },
      { label: "Missing", value: "missing" },
      { label: "Found", value: "found" },
    ],
  },
  {
    key: "custodyStatus",
    label: "Custody Status",
    options: [
      { label: "All", value: "all" },
      { label: "Under Investigation", value: "under_investigation" },
    ],
  },
];

const sortOptions: Array<{ label: string; value: PostRecordSortDirection }> = [
  { label: "Latest Upload (Desc)", value: "desc" },
  { label: "Oldest Upload (Asc)", value: "asc" },
];

export function PostRecordsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: PostRecordFilters = getPostRecordFiltersFromSearchParams(searchParams);

  const [sortDir, setSortDir] = useState<PostRecordSortDirection>("desc");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [pendingNotifyRecord, setPendingNotifyRecord] = useState<PostRecord | null>(null);
  const [pendingNotifyGuardRecord, setPendingNotifyGuardRecord] = useState<PostRecord | null>(null);
  const lastNotifyTimeRef = useRef<Map<string, number>>(new Map());
  const feedRef = useRef<HTMLDivElement | null>(null);

  const recordsQuery = usePostRecords({
    ...(filters.itemType !== "all" ? { itemType: filters.itemType } : {}),
    postStatus: filters.postStatus === "all" ? null : filters.postStatus.toLowerCase(),
    itemStatus: filters.itemStatus === "all" ? null : filters.itemStatus.toLowerCase(),
    custodyStatus: filters.custodyStatus === "all" ? null : filters.custodyStatus,
    sortDirection: sortDir,
    pageSize: 10,
  });
  const records = flattenInfinitePages(recordsQuery.data?.pages);
  const visibleRecords = records;

  const updateFilters = (key: PostRecordFilterKey, value: PostRecordFilters[PostRecordFilterKey]) => {
    const newFilters = { ...filters, [key]: value };

    router.push(buildPostRecordsUrl(newFilters));
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleRefresh = async () => {
    await recordsQuery.refetch();
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!recordsQuery.hasNextPage || recordsQuery.isFetchingNextPage) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      void recordsQuery.fetchNextPage();
    }
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

    if (action === "notify-guard") {
      setPendingNotifyGuardRecord(record);
      return;
    }

    if (action === "share") {
      const shareUrl = `${window.location.origin}/staff/post-record/view/${record.postId}`;
      shareLink({
        title: record.itemName,
        text: `View the ${record.itemName} post record.`,
        url: shareUrl,
      })
        .then((result) => {
          if (result === "copied") {
            setToast({ message: "Link copied to clipboard", tone: "success" });
            return;
          }

          if (result === "shared") {
            setToast({ message: "Post shared successfully", tone: "success" });
          }
        })
        .catch(() => setToast({ message: "Failed to share post", tone: "danger" }));
      return;
    }

    if (action === "copy-item-id") {
      if (!record.itemId) {
        setToast({ message: "Item ID is not available", tone: "danger" });
        return;
      }

      navigator.clipboard
        .writeText(record.itemId)
        .then(() => setToast({ message: "Item ID copied to clipboard", tone: "success" }))
        .catch(() => setToast({ message: "Failed to copy Item ID", tone: "danger" }));
      return;
    }

    if (action === "notify") {
      if (!record.posterId) {
        setToast({ message: "Owner is not available for notification", tone: "danger" });
        return;
      }

      const currentTime = Date.now();
      const lastNotifyTime = lastNotifyTimeRef.current.get(record.postId) ?? 0;
      const timeSince = currentTime - lastNotifyTime;

      if (timeSince < 10000) {
        const remainingSeconds = Math.ceil((10000 - timeSince) / 1000);
        setToast({
          message: `Please wait ${remainingSeconds} seconds before notifying again`,
          tone: "danger",
        });
        return;
      }

      setPendingNotifyRecord(record);
    }
  };

  const handleConfirmNotify = () => {
    if (!pendingNotifyRecord) return;
    const record = pendingNotifyRecord;
    sendNotification({
      user_id: record.posterId ?? "",
      title: "Great News! A Possible Match to Your Item",
      body: `We found items that may match your ${record.itemName}. Please proceed to the Security Office during office hours to verify.`,
      description: "Please proceed to the Security Office during office hours.",
      type: "match",
      data: { postId: record.postId, itemId: record.itemId },
      ...(record.imageUrl ? { image_url: record.imageUrl } : {}),
    })
      .then(() => {
        lastNotifyTimeRef.current.set(record.postId, Date.now());
        setToast({ message: "Owner notified successfully!", tone: "success" });
      })
      .catch(() => {
        setToast({ message: "Failed to notify owner", tone: "danger" });
      })
      .finally(() => {
        setPendingNotifyRecord(null);
      });
  };

  const handleConfirmNotifyGuard = () => {
    if (!pendingNotifyGuardRecord) return;
    const record = pendingNotifyGuardRecord;
    notifyGuardForCustodyFollowUp(Number(record.postId))
      .then(() => {
        setToast({ message: "Guard notified successfully.", tone: "success" });
      })
      .catch((error) => {
        setToast({
          message: error instanceof Error ? error.message : "Failed to notify guard",
          tone: "danger",
        });
      })
      .finally(() => {
        setPendingNotifyGuardRecord(null);
      });
  };

  const errorMessage = recordsQuery.error instanceof Error ? recordsQuery.error.message : null;

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <PostRecordsFeed
        feedRef={feedRef}
        onScroll={handleScroll}
        errorMessage={errorMessage}
        isLoading={recordsQuery.isLoading}
        records={visibleRecords}
        hasNextPage={recordsQuery.hasNextPage}
        onAction={handleAction}
      />
      <PostRecordsSidebar
        sortDir={sortDir}
        filters={filters}
        sortOptions={sortOptions}
        filterGroups={filterGroups}
        isRefetching={recordsQuery.isRefetching}
        onSearch={() => router.push("/staff/search")}
        onRefresh={() => void handleRefresh()}
        onSortChange={setSortDir}
        onFilterChange={updateFilters}
      />

      {toast ? <CustomToast message={toast.message} tone={toast.tone} mode="floating" /> : null}
      <PostRecordsNotifyModal
        isOpen={Boolean(pendingNotifyRecord)}
        title="Notify Owner"
        description="Are you sure you want to notify the owner that similar items are in the security office?"
        onCancel={() => setPendingNotifyRecord(null)}
        onConfirm={handleConfirmNotify}
      />
      <PostRecordsNotifyModal
        isOpen={Boolean(pendingNotifyGuardRecord)}
        title="Notify Guard"
        description="Are you sure you want to notify the guard assigned to follow up on this under-investigation item?"
        onCancel={() => setPendingNotifyGuardRecord(null)}
        onConfirm={handleConfirmNotifyGuard}
      />
    </section>
  );
}
