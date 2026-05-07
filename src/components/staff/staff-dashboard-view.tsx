"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
  filterDashboardPosts,
  flattenInfinitePages,
  postKeys,
  useDashboardPosts,
  useDashboardStats,
} from "@/hooks/queries/post-queries";
import { updatePostStatus } from "@/services/posts-service";
import { sendNotification } from "@/services/notifications-service";
import {
  DashboardFeed,
  DashboardRejectModal,
  DashboardSidebar,
  type DashboardToast,
} from "@/components/staff/staff-dashboard-view-sections";
import type { CustomToastTone } from "@/components/ui/custom-toast";
import type { CompactPost } from "@/types/compact-post";

export function StaffDashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const feedRef = useRef<HTMLDivElement | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const [dismissedPostIds, setDismissedPostIds] = useState<string[]>([]);

  const typeFromUrl = searchParams.get("type");
  const selectedType = (typeFromUrl === "lost" || typeFromUrl === "found" || typeFromUrl === "all"
    ? typeFromUrl
    : "all") as "lost" | "found" | "all";
  const itemTypeForFetch = selectedType === "lost" ? "missing" : selectedType === "found" ? "found" : undefined;

  const dashboardPostsQuery = useDashboardPosts({
    ...(itemTypeForFetch ? { itemType: itemTypeForFetch } : {}),
    postStatus: "pending",
    pageSize: 10,
  });
  const dashboardStatsQuery = useDashboardStats();
  const posts = flattenInfinitePages(dashboardPostsQuery.data?.pages);

  const [toasts, setToasts] = useState<DashboardToast[]>([]);
  const [pendingRejectPost, setPendingRejectPost] = useState<CompactPost | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState("");
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

  useEffect(() => {
    setDismissedPostIds([]);
  }, [itemTypeForFetch]);

  const filteredPosts = useMemo(() => {
    const visiblePosts = posts.filter((post) => !dismissedPostIds.includes(post.postId));
    return filterDashboardPosts(visiblePosts, selectedType, itemTypeForFetch);
  }, [dismissedPostIds, itemTypeForFetch, posts, selectedType]);

  const handleRefresh = async () => {
    setDismissedPostIds([]);
    await Promise.all([dashboardPostsQuery.refetch(), dashboardStatsQuery.refetch()]);
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

      setDismissedPostIds((current) => [...current, post.postId]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.dashboard({ postStatus: "pending", ...(itemTypeForFetch ? { itemType: itemTypeForFetch } : {}), pageSize: 10 }) }),
        queryClient.invalidateQueries({ queryKey: postKeys.dashboardStats }),
      ]);

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
    if (!dashboardPostsQuery.hasNextPage || dashboardPostsQuery.isFetchingNextPage) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      void dashboardPostsQuery.fetchNextPage();
    }
  };

  const errorMessage =
    dashboardPostsQuery.error instanceof Error
      ? dashboardPostsQuery.error.message
      : dashboardStatsQuery.error instanceof Error
        ? dashboardStatsQuery.error.message
        : null;
  const isInitialLoading = dashboardPostsQuery.isLoading;
  const isRefreshing = dashboardPostsQuery.isRefetching || dashboardStatsQuery.isRefetching;
  const stats = dashboardStatsQuery.data ?? { pendingClaims: 0, fraudReports: 0, unreadAlerts: 0 };

  return (
    <section className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
      <DashboardFeed
        feedRef={feedRef}
        onScroll={handleScroll}
        selectedType={selectedType}
        isRefreshing={isRefreshing}
        onRefresh={() => void handleRefresh()}
        toasts={toasts}
        errorMessage={errorMessage}
        isInitialLoading={isInitialLoading}
        filteredPosts={filteredPosts}
        hasNextPage={dashboardPostsQuery.hasNextPage}
        onAccept={handleAccept}
        onReject={handleReject}
        pendingDecisionPostId={pendingDecisionPostId}
        isSubmittingDecision={isSubmittingDecision}
        pendingDecisionType={pendingDecisionType}
      />
      <DashboardSidebar stats={stats} selectedType={selectedType} onNavigate={(path) => router.push(path)} />
      <DashboardRejectModal
        isOpen={Boolean(pendingRejectPost)}
        rejectReasons={rejectReasons}
        selectedRejectReason={selectedRejectReason}
        isSubmittingDecision={isSubmittingDecision}
        onSelectReason={setSelectedRejectReason}
        onCancel={() => {
          if (isSubmittingDecision) return;
          setPendingRejectPost(null);
          setSelectedRejectReason("");
        }}
        onConfirm={handleRejectConfirm}
      />
    </section>
  );
}
