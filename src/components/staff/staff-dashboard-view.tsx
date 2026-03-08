"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { CompactPost, CompactPostCard } from "@/components/staff/compact-post-card";
import { PostTagChip } from "@/components/staff/post-tag-chip";
import { StaffStatCard } from "@/components/staff/staff-stat-card";
import { CustomToastStack, type CustomToastTone } from "@/components/ui/custom-toast";
import { useStaffDashboardStore } from "@/stores/staff-dashboard-store";
import { updatePostStatus } from "@/services/posts-service";
import { sendNotification } from "@/services/notifications-service";

interface DashboardToast {
  id: string;
  message: string;
  tone: CustomToastTone;
}

export function StaffDashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const feedRef = useRef<HTMLDivElement | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const {
    posts,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    fetchPosts,
    loadMore,
    refresh,
    stats,
    fetchStats,
    removePost,
  } = useStaffDashboardStore();

  const typeFromUrl = searchParams.get("type");
  const selectedType = (typeFromUrl === "lost" || typeFromUrl === "found" || typeFromUrl === "all"
    ? typeFromUrl
    : "all") as "lost" | "found" | "all";
  const itemTypeForFetch = selectedType === "lost" ? "missing" : selectedType === "found" ? "found" : undefined;

  const [toasts, setToasts] = useState<DashboardToast[]>([]);
  const [pendingRejectPost, setPendingRejectPost] = useState<CompactPost | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [pendingDecisionPostId, setPendingDecisionPostId] = useState<string | null>(null);
  const [pendingDecisionType, setPendingDecisionType] = useState<"accept" | "reject" | null>(null);

  const rejectReasons = [
    "Item is not identified in storage.",
    "Details don't match the item in question.",
    "This is a spam or malicious post.",
    "There is more than 1 instance of this post.",
    "Item has been discarded.",
  ];

  const pushToast = (message: string, tone: CustomToastTone) => {
    toastIdRef.current += 1;
    const id = `dashboard-toast-${toastIdRef.current}`;
    setToasts((previous) => [...previous, { id, message, tone }]);

    const timer = window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
      toastTimersRef.current.delete(id);
    }, 3000);

    toastTimersRef.current.set(id, timer);
  };

  useEffect(() => {
    const activeTimers = toastTimersRef.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedType === "all") {
      return posts;
    }
    return posts.filter((post) => {
      const byViewType = itemTypeForFetch === "missing" ? post.itemType === "lost" : post.itemType === "found";
      return byViewType;
    });
  }, [posts, itemTypeForFetch, selectedType]);

  useEffect(() => {
    fetchPosts({
      ...(itemTypeForFetch ? { itemType: itemTypeForFetch } : {}),
      postStatus: "pending",
      pageSize: 10,
    });
  }, [fetchPosts, itemTypeForFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    refresh();
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePostDecision = async (
    post: CompactPost,
    decision: "accepted" | "rejected",
    rejectionReason?: string
  ) => {
    if (isSubmittingDecision) return;
    if (!post.posterId) {
      pushToast("Owner is not available for notification", "danger");
      return;
    }

    setIsSubmittingDecision(true);
    setPendingDecisionPostId(post.postId);
    setPendingDecisionType(decision === "accepted" ? "accept" : "reject");
    try {
      await updatePostStatus(post.postId, {
        status: decision,
        ...(decision === "rejected" && rejectionReason ? { rejection_reason: rejectionReason } : {}),
      });

      const notificationTitle = decision === "accepted" ? "Post Accepted" : "Post Rejected";
      const notificationBody =
        decision === "accepted"
          ? `Your post about "${post.itemName}" has been accepted and is now visible to users.`
          : `Your post about "${post.itemName}" has been rejected. Reason: ${rejectionReason ?? "No reason provided."}`;

      await sendNotification({
        user_id: post.posterId,
        title: notificationTitle,
        body: notificationBody,
        description:
          decision === "accepted" ? "Your post is now visible to users." : rejectionReason ?? "No reason provided.",
        type: decision === "accepted" ? "accept" : "rejection",
        data: {
          postId: post.postId,
          itemId: post.itemId,
          status: decision,
          ...(decision === "rejected" && rejectionReason ? { rejection_reason: rejectionReason } : {}),
        },
        ...(post.imageUrl ? { image_url: post.imageUrl } : {}),
      });

      removePost(post.postId);
      void fetchStats();
      pushToast(
        decision === "accepted" ? "Post accepted and owner notified" : "Post rejected and owner notified",
        decision === "accepted" ? "success" : "danger"
      );
    } catch {
      pushToast(decision === "accepted" ? "Failed to accept post" : "Failed to reject post", "danger");
    } finally {
      setIsSubmittingDecision(false);
      setPendingDecisionPostId(null);
      setPendingDecisionType(null);
    }
  };

  const handleAccept = (post: CompactPost) => {
    void handlePostDecision(post, "accepted");
  };

  const handleReject = (post: CompactPost) => {
    setPendingRejectPost(post);
    setSelectedRejectReason("");
  };

  const handleRejectConfirm = () => {
    if (!pendingRejectPost) return;
    if (!selectedRejectReason) {
      pushToast("Please select a rejection reason", "danger");
      return;
    }

    void handlePostDecision(pendingRejectPost, "rejected", selectedRejectReason).finally(() => {
      setPendingRejectPost(null);
      setSelectedRejectReason("");
    });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!hasMore) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      loadMore();
    }
  };

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#1D2981]">Staff Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Review and manage pending posts submitted by users.</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <span>View mode:</span>
              <PostTagChip
                label={selectedType === "all" ? "All Items" : selectedType === "lost" ? "Missing" : "Found"}
                tone="primary"
              />
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Showing Pending Post Only</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <RefreshCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <CustomToastStack toasts={toasts} />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading && filteredPosts.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`dashboard-loading-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <CompactPostCard
              key={post.postId}
              post={post}
              onAccept={handleAccept}
              onReject={handleReject}
              actionsDisabled={isSubmittingDecision}
              loadingAction={pendingDecisionPostId === post.postId ? pendingDecisionType : null}
            />
          ))
        )}
        {filteredPosts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {isLoading ? "Loading posts..." : "No posts match the selected filters."}
          </p>
        ) : null}
        {!hasMore && filteredPosts.length > 0 ? (
          <p className="text-center text-sm text-slate-500">You&apos;re all caught up!</p>
        ) : null}
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
        <StaffStatCard
          title="Pending Claims"
          value={stats.pendingClaims}
          onClick={() => router.push("/staff/post-records")}
        />
        <StaffStatCard
          title="Fraud Reports"
          value={stats.fraudReports}
          onClick={() => router.push("/staff/fraud-reports")}
        />
        <StaffStatCard
          title="Unread Alerts"
          value={stats.unreadAlerts}
          onClick={() => router.push("/staff/notifications")}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#1D2981]">Item Type</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              { label: "All", value: "all" },
              { label: "Missing", value: "lost" },
              { label: "Found", value: "found" },
            ] as const).map((option) => {
              const isActive = selectedType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    router.push(option.value === "all" ? "/staff" : `/staff?type=${option.value}`)
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
      {pendingRejectPost ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Reject Post</h2>
            <p className="mt-2 text-sm text-slate-600">Select a reason to reject the post.</p>
            <div className="mt-4 space-y-2">
              {rejectReasons.map((reason) => {
                const isActive = selectedRejectReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedRejectReason(reason)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "border-[#1D2981]/30 bg-[#1D2981]/10 text-[#1D2981]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSubmittingDecision) return;
                  setPendingRejectPost(null);
                  setSelectedRejectReason("");
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={handleRejectConfirm}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingDecision ? "Rejecting..." : "Reject Post"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
