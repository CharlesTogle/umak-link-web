"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUnreadNotificationsCount } from "@/services/notifications-service";

export const notificationKeys = {
  unreadCount: (userId: string | null) =>
    ["notifications", "unread-count", userId] as const,
};

export function useUnreadNotificationsCount(userId: string | null) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: fetchUnreadNotificationsCount,
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}
