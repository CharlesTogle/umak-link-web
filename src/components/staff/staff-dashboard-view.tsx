"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { POST_REJECTION_REASONS } from "@/config/constants";
import {
  flattenInfinitePages,
  postKeys,
  useDashboardPosts,
  useDashboardStats,
} from "@/hooks/queries/post-queries";
import { shareLink } from "@/lib/share-link";
import { updatePostStatus } from "@/services/posts-service";
import { sendNotification } from "@/services/notifications-service";
import {
  DashboardFeed,
  DashboardRejectModal,
  DashboardSidebar,
} from "@/components/staff/staff-dashboard-view-sections";
import type { CustomToastTone } from "@/components/ui/custom-toast";
import type { CompactPost } from "@/types/compact-post";
import {
  initialStaffDashboardUiState,
  staffDashboardUiReducer,
} from "@/components/staff/staff-dashboard-view-state";

export function StaffDashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const feedRef = useRef<HTMLDivElement | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const lastNotifyTimeRef = useRef<Map<string, number>>(new Map());
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
  const [ui, dispatchUi] = useReducer(
    staffDashboardUiReducer,
    initialStaffDashboardUiState
  );

  const pushToast = (message: string, tone: CustomToastTone) => {
    toastIdRef.current += 1;
    const id = `dashboard-toast-${toastIdRef.current}`;
    dispatchUi({ type: "add_toast", value: { id, message, tone } });

    const timer = window.setTimeout(() => {
      dispatchUi({ type: "remove_toast", id });
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

    if (selectedType === "all") {
      return visiblePosts;
    }

    return visiblePosts.filter((post) =>
      itemTypeForFetch === "missing"
        ? post.itemType === "lost"
        : post.itemType === "found"
    );
  }, [dismissedPostIds, itemTypeForFetch, posts, selectedType]);

  const handleRefresh = async () => {
    setDismissedPostIds([]);
    await Promise.all([dashboardPostsQuery.refetch(), dashboardStatsQuery.refetch()]);
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dismissAndRefreshPost = async (postId: string) => {
    setDismissedPostIds((current) => [...current, postId]);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: postKeys.dashboard({ postStatus: "pending", ...(itemTypeForFetch ? { itemType: itemTypeForFetch } : {}), pageSize: 10 }) }),
      queryClient.invalidateQueries({ queryKey: postKeys.dashboardStats }),
    ]);
  };

  const handlePostDecision = async (
    post: CompactPost,
    decision: "accepted" | "rejected",
    rejectionReason?: string
  ) => {
    if (ui.isSubmittingDecision) return;
    if (!post.posterId) {
      pushToast("Owner is not available for notification", "danger");
      return;
    }

    dispatchUi({
      type: "start_decision",
      postId: post.postId,
      decisionType: decision === "accepted" ? "accept" : "reject",
    });

    try {
      await updatePostStatus(post.postId, {
        status: decision,
        ...(decision === "rejected" && rejectionReason ? { rejection_reason: rejectionReason } : {}),
      });

      const notificationTitle = decision === "accepted" ? "Post Accepted" : "Post Rejected";
      const notificationBody =
        decision === "accepted"
          ? `Your post about "${post.itemName}" has been accepted and is now visible on the platform.`
          : `Your post about "${post.itemName}" has been rejected and will not be published on the platform. You can edit and submit again or delete it. Reason: ${rejectionReason ?? "No reason provided."}`;

      await sendNotification({
        user_id: post.posterId,
        title: notificationTitle,
        body: notificationBody,
        description:
          decision === "accepted"
            ? "Your post is now visible on the platform."
            : rejectionReason ?? "No reason provided.",
        type: decision === "accepted" ? "accept" : "rejection",
        data: {
          postId: post.postId,
          itemId: post.itemId,
          status: decision,
          ...(decision === "rejected" && rejectionReason ? { rejection_reason: rejectionReason } : {}),
        },
        ...(post.imageUrl ? { image_url: post.imageUrl } : {}),
      });

      await dismissAndRefreshPost(post.postId);

      pushToast(
        decision === "accepted"
          ? "Post approved and owner notified"
          : "Post rejected and owner notified",
        decision === "accepted" ? "success" : "danger"
      );
    } catch {
      pushToast(decision === "accepted" ? "Failed to accept post" : "Failed to reject post", "danger");
    } finally {
      dispatchUi({ type: "finish_decision" });
    }
  };

  const handleAccept = (post: CompactPost) => {
    if (post.itemType === "lost") {
      void handleMatchMissingPost(post);
      return;
    }

    void handlePostDecision(post, "accepted");
  };

  const handleReject = (post: CompactPost) => {
    dispatchUi({ type: "open_reject_modal", post });
  };

  const handleRejectConfirm = () => {
    if (!ui.pendingRejectPost) return;
    if (!ui.selectedRejectReason) {
      pushToast("Please select a rejection reason", "danger");
      return;
    }

    void handlePostDecision(
      ui.pendingRejectPost,
      "rejected",
      ui.selectedRejectReason
    ).finally(() => {
      dispatchUi({ type: "close_reject_modal" });
    });
  };

  const handleMatchMissingPost = async (post: CompactPost) => {
    if (ui.isSubmittingDecision) return;
    if (!post.posterId) {
      pushToast("Owner is not available for notification", "danger");
      return;
    }

    dispatchUi({
      type: "start_decision",
      postId: post.postId,
      decisionType: "accept",
    });

    try {
      await updatePostStatus(post.postId, { status: "accepted" });
      await sendNotification({
        user_id: post.posterId,
        title: "Great News! A Possible Match to Your Item",
        body: `We found items that may match your ${post.itemName}. Please proceed to the Security Office during office hours to verify.`,
        description: "Please proceed to the Security Office during office hours.",
        type: "match",
        data: { postId: post.postId, itemId: post.itemId },
        ...(post.imageUrl ? { image_url: post.imageUrl } : {}),
      });

      await dismissAndRefreshPost(post.postId);
      pushToast("Possible match sent to owner", "success");
    } catch {
      pushToast("Failed to match missing item", "danger");
    } finally {
      dispatchUi({ type: "finish_decision" });
    }
  };

  const handleNotifySimilar = async (post: CompactPost) => {
    if (ui.isSubmittingDecision) return;
    if (!post.posterId) {
      pushToast("Owner is not available for notification", "danger");
      return;
    }

    const currentTime = Date.now();
    const lastNotifyTime = lastNotifyTimeRef.current.get(post.postId) ?? 0;
    const timeSinceLastNotify = currentTime - lastNotifyTime;

    if (timeSinceLastNotify < 10000) {
      const remainingSeconds = Math.ceil((10000 - timeSinceLastNotify) / 1000);
      pushToast(`Please wait ${remainingSeconds} seconds before notifying again`, "danger");
      return;
    }

    dispatchUi({
      type: "start_decision",
      postId: post.postId,
      decisionType: "notify",
    });

    try {
      await sendNotification({
        user_id: post.posterId,
        title: "Great News! A Possible Match to Your Item",
        body: `We found items that may match your ${post.itemName}. Please proceed to the Security Office during office hours to verify.`,
        description: "Please proceed to the Security Office during office hours.",
        type: "match",
        data: { postId: post.postId, itemId: post.itemId },
        ...(post.imageUrl ? { image_url: post.imageUrl } : {}),
      });
      lastNotifyTimeRef.current.set(post.postId, Date.now());
      pushToast("Owner notified successfully!", "success");
    } catch {
      pushToast("Failed to notify owner", "danger");
    } finally {
      dispatchUi({ type: "finish_decision" });
    }
  };

  const handleShare = async (post: CompactPost) => {
    try {
      const shareResult = await shareLink({
        title: post.itemName,
        text: `View the ${post.itemName} post record.`,
        url: `${window.location.origin}/staff/post-record/view/${post.postId}`,
      });

      if (shareResult === "copied") {
        pushToast("Link copied to clipboard", "success");
      }

      if (shareResult === "shared") {
        pushToast("Post shared successfully", "success");
      }
    } catch {
      pushToast("Failed to share post", "danger");
    }
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
        toasts={ui.toasts}
        errorMessage={errorMessage}
        isInitialLoading={isInitialLoading}
        filteredPosts={filteredPosts}
        hasNextPage={dashboardPostsQuery.hasNextPage}
        onAccept={handleAccept}
        onReject={handleReject}
        onNotifySimilar={(post) => void handleNotifySimilar(post)}
        onShare={(post) => void handleShare(post)}
        pendingDecisionPostId={ui.pendingDecisionPostId}
        isSubmittingDecision={ui.isSubmittingDecision}
        pendingDecisionType={ui.pendingDecisionType}
      />
      <DashboardSidebar stats={stats} selectedType={selectedType} onNavigate={(path) => router.push(path)} />
      <DashboardRejectModal
        isOpen={Boolean(ui.pendingRejectPost)}
        rejectReasons={POST_REJECTION_REASONS}
        selectedRejectReason={ui.selectedRejectReason}
        isSubmittingDecision={ui.isSubmittingDecision}
        onSelectReason={(reason) => dispatchUi({ type: "set_reject_reason", value: reason })}
        onCancel={() => {
          if (ui.isSubmittingDecision) return;
          dispatchUi({ type: "close_reject_modal" });
        }}
        onConfirm={handleRejectConfirm}
      />
    </section>
  );
}
