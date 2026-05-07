"use client";

import { RefreshCcw } from "lucide-react";
import { CompactPostCard } from "@/components/staff/compact-post-card";
import { PostTagChip } from "@/components/staff/post-tag-chip";
import { StaffStatCard } from "@/components/staff/staff-stat-card";
import { CustomToastStack, type CustomToastTone } from "@/components/ui/custom-toast";
import type { CompactPost } from "@/types/compact-post";

export interface DashboardToast {
  id: string;
  message: string;
  tone: CustomToastTone;
}

interface DashboardFeedProps {
  feedRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  selectedType: "lost" | "found" | "all";
  isRefreshing: boolean;
  onRefresh: () => void;
  toasts: DashboardToast[];
  errorMessage: string | null;
  isInitialLoading: boolean;
  filteredPosts: CompactPost[];
  hasNextPage?: boolean;
  onAccept: (post: CompactPost) => void;
  onReject: (post: CompactPost) => void;
  onNotifySimilar: (post: CompactPost) => void;
  onShare: (post: CompactPost) => void;
  pendingDecisionPostId: string | null;
  isSubmittingDecision: boolean;
  pendingDecisionType: "accept" | "reject" | "notify" | null;
}

export function DashboardFeed({
  feedRef,
  onScroll,
  selectedType,
  isRefreshing,
  onRefresh,
  toasts,
  errorMessage,
  isInitialLoading,
  filteredPosts,
  hasNextPage,
  onAccept,
  onReject,
  onNotifySimilar,
  onShare,
  pendingDecisionPostId,
  isSubmittingDecision,
  pendingDecisionType,
}: DashboardFeedProps) {
  return (
    <div ref={feedRef} onScroll={onScroll} className="min-h-0 space-y-4 overflow-y-auto pr-1 lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1D2981]">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Review and manage pending posts submitted by users.</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <span>View mode:</span>
            <PostTagChip label={selectedType === "all" ? "All Items" : selectedType === "lost" ? "Missing" : "Found"} tone="primary" />
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">Showing Pending Post Only</span>
          </div>
        </div>
        <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50">
          <RefreshCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <CustomToastStack toasts={toasts} />
      {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}

      {isInitialLoading && filteredPosts.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`dashboard-loading-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
            onAccept={onAccept}
            onReject={onReject}
            onNotifySimilar={onNotifySimilar}
            onShare={onShare}
            actionsDisabled={pendingDecisionPostId === post.postId && isSubmittingDecision}
            loadingAction={pendingDecisionPostId === post.postId ? pendingDecisionType : null}
          />
        ))
      )}

      {filteredPosts.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{isInitialLoading ? "Loading posts..." : "No posts match the selected filters."}</p> : null}
      {!hasNextPage && filteredPosts.length > 0 ? <p className="text-center text-sm text-slate-500">You&apos;re all caught up!</p> : null}
    </div>
  );
}

interface DashboardSidebarProps {
  stats: { pendingClaims: number; fraudReports: number; unreadAlerts: number };
  selectedType: "lost" | "found" | "all";
  onNavigate: (path: string) => void;
}

export function DashboardSidebar({
  stats,
  selectedType,
  onNavigate,
}: DashboardSidebarProps) {
  return (
    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:col-span-4">
      <StaffStatCard title="Pending Claims" value={stats.pendingClaims} onClick={() => onNavigate("/staff/post-records")} />
      <StaffStatCard title="Fraud Reports" value={stats.fraudReports} onClick={() => onNavigate("/staff/fraud-reports")} />
      <StaffStatCard title="Unread Alerts" value={stats.unreadAlerts} onClick={() => onNavigate("/staff/notifications")} />
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
              <button key={option.value} type="button" onClick={() => onNavigate(option.value === "all" ? "/staff" : `/staff?type=${option.value}`)} className={`rounded-full border px-3 py-1.5 text-sm transition ${isActive ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

interface DashboardRejectModalProps {
  isOpen: boolean;
  rejectReasons: readonly string[];
  selectedRejectReason: string;
  isSubmittingDecision: boolean;
  onSelectReason: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DashboardRejectModal({
  isOpen,
  rejectReasons,
  selectedRejectReason,
  isSubmittingDecision,
  onSelectReason,
  onCancel,
  onConfirm,
}: DashboardRejectModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Reject Post</h2>
        <p className="mt-2 text-sm text-slate-600">Select a reason to reject the post.</p>
        <div className="mt-4 space-y-2">
          {rejectReasons.map((reason) => {
            const isActive = selectedRejectReason === reason;
            return (
              <button key={reason} type="button" onClick={() => onSelectReason(reason)} className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${isActive ? "border-[#1D2981]/30 bg-[#1D2981]/10 text-[#1D2981]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {reason}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={isSubmittingDecision} onClick={onConfirm} className="rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmittingDecision ? "Rejecting..." : "Reject Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
