"use client";

import { useEffect, useRef, useState } from "react";
import { CustomToastStack, type CustomToastTone } from "@/components/ui/custom-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUnreadNotificationsCount } from "@/hooks/queries/notification-queries";
import { logError } from "@/lib/error-utils";
import { filterVisibleNotifications } from "@/lib/notifications";
import { fetchNotifications, type NotificationRecord } from "@/services/notifications-service";

interface NotificationToastItem {
  id: string;
  message: string;
  tone: CustomToastTone;
}

function notificationIdValue(notificationId: string | number): string {
  return String(notificationId);
}

function sortNotificationsByCreatedAt(
  first: NotificationRecord,
  second: NotificationRecord
): number {
  const firstTime = first.created_at ? Date.parse(first.created_at) : 0;
  const secondTime = second.created_at ? Date.parse(second.created_at) : 0;
  return firstTime - secondTime;
}

function buildUnreadIdSet(notifications: NotificationRecord[]): Set<string> {
  return new Set(
    notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notificationIdValue(notification.notification_id))
  );
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function buildToastMessage(notification: NotificationRecord): string {
  const title = trimToNull(notification.title);
  const description = trimToNull(notification.description) ?? trimToNull(notification.body);

  const message =
    title && description
      ? `${title}: ${description}`
      : title ?? description ?? "You have a new notification.";

  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

function NotificationToastWatcherSession({ userId }: { userId: string }) {
  const unreadCountQuery = useUnreadNotificationsCount(userId);
  const unreadCount = unreadCountQuery.data?.unread_count;
  const [toasts, setToasts] = useState<NotificationToastItem[]>([]);

  const previousUnreadCountRef = useRef<number | null>(null);
  const knownUnreadIdsRef = useRef<Set<string>>(new Set());
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const activeTimers = toastTimersRef.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  useEffect(() => {
    if (!userId || unreadCount === undefined) return;

    let isCancelled = false;

    const syncNotifications = async () => {
      const previousUnreadCount = previousUnreadCountRef.current;

      if (previousUnreadCount === unreadCount) return;

      if (previousUnreadCount === null) {
        previousUnreadCountRef.current = unreadCount;

        if (unreadCount === 0) {
          knownUnreadIdsRef.current = new Set();
          return;
        }

        try {
          const notifications = filterVisibleNotifications(
            await fetchNotifications(),
            userId
          );
          if (isCancelled) return;
          knownUnreadIdsRef.current = buildUnreadIdSet(notifications);
        } catch (error) {
          logError("Failed to baseline unread notifications:", error);
        }

        return;
      }

      try {
        const notifications = filterVisibleNotifications(
          await fetchNotifications(),
          userId
        );
        if (isCancelled) return;

        const unreadNotifications = notifications
          .filter((notification) => !notification.is_read)
          .sort(sortNotificationsByCreatedAt);
        const nextUnreadIds = buildUnreadIdSet(unreadNotifications);

        if (unreadCount > previousUnreadCount) {
          const newNotifications = unreadNotifications.filter(
            (notification) =>
              !knownUnreadIdsRef.current.has(notificationIdValue(notification.notification_id))
          );

          if (newNotifications.length > 0) {
            setToasts((previousToasts) => {
              const nextToasts = [...previousToasts];

              for (const notification of newNotifications) {
                toastIdRef.current += 1;
                const id = `notification-toast-${toastIdRef.current}`;
                nextToasts.push({
                  id,
                  message: buildToastMessage(notification),
                  tone: "info",
                });

                const timer = window.setTimeout(() => {
                  setToasts((currentToasts) =>
                    currentToasts.filter((toast) => toast.id !== id)
                  );
                  toastTimersRef.current.delete(id);
                }, 5000);

                toastTimersRef.current.set(id, timer);
              }

              return nextToasts;
            });
          }
        }

        knownUnreadIdsRef.current = nextUnreadIds;
        previousUnreadCountRef.current = unreadCount;
      } catch (error) {
        logError("Failed to sync notification toast state:", error);
      }
    };

    void syncNotifications();

    return () => {
      isCancelled = true;
    };
  }, [unreadCount, userId]);

  return <CustomToastStack toasts={toasts} />;
}

export function NotificationToastWatcher() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user?.user_id) {
    return null;
  }

  return <NotificationToastWatcherSession key={user.user_id} userId={user.user_id} />;
}
