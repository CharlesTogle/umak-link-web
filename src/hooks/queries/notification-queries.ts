"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUnreadNotificationsCount } from "@/services/notifications-service";

export const notificationKeys = {
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useUnreadNotificationsCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadNotificationsCount,
    enabled,
    refetchInterval: 30_000,
  });
}
