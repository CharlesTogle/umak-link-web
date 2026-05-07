"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Trash2, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/staff/notification-item";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logError } from "@/lib/error-utils";
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
  type NotificationRecord,
} from "@/services/notifications-service";

export default function StaffNotificationsPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const userId = user?.user_id;

  useEffect(() => {
    if (!userLoading && userId) {
      loadNotifications();
    }
  }, [userId, userLoading]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      logError("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      logError("Failed to mark notification as read:", error);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch (error) {
      logError("Failed to delete notification:", error);
    }
  };

  const handleDeleteAll = async () => {
    setShowBulkMenu(false);
    try {
      await Promise.all(notifications.map((n) => deleteNotification(n.notification_id)));
      setNotifications([]);
    } catch (error) {
      logError("Failed to delete all notifications:", error);
    }
  };

  const handleMarkAllRead = async () => {
    setShowBulkMenu(false);
    try {
      await Promise.all(notifications.map((n) => markNotificationAsRead(n.notification_id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      logError("Failed to mark all as read:", error);
    }
  };

  // Sort notifications: global_announcement at top
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.type === "global_announcement" && b.type !== "global_announcement") return -1;
    if (a.type !== "global_announcement" && b.type === "global_announcement") return 1;
    return 0;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1D2981]">Notifications</h1>
          <p className="text-sm text-slate-500">
            {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
          </p>
        </div>

        {/* Bulk actions */}
        {notifications.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              aria-label="Bulk actions"
              className="text-slate-700 hover:bg-slate-100"
            >
              <MoreVertical className="size-4" />
            </Button>

            {showBulkMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />

                {/* Dropdown menu */}
                <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                  <button
                    onClick={handleMarkAllRead}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <CheckCheck className="size-4" />
                    Mark all as read
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                    Delete all
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Loading skeleton
          <div className="divide-y divide-slate-200">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 size-5 animate-pulse rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                </div>
                <div className="size-8 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : sortedNotifications.length === 0 ? (
          // Empty state
          <div className="flex h-full items-center justify-center px-4 py-20 text-center">
            <div>
              <p className="text-lg font-medium text-slate-900">You&apos;re all caught up</p>
              <p className="mt-1 text-sm text-slate-500">No notifications to display</p>
            </div>
          </div>
        ) : (
          // Notifications list
          <div className="divide-y divide-slate-200">
            {sortedNotifications.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={{
                  notification_id: notification.notification_id,
                  type: notification.type,
                  title: notification.title,
                  description: notification.description || notification.body,
                  is_read: notification.is_read,
                  created_at: notification.created_at,
                  ...(notification.data ? { data: notification.data } : {}),
                  sent_to: notification.sent_to,
                  sent_by: notification.sent_by,
                  image_url: notification.image_url,
                }}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
