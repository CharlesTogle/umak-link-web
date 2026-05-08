import type { NotificationRecord } from "@/services/notifications-service";

export function isSelfAuthoredAnnouncement(
  notification: Pick<NotificationRecord, "type" | "sent_by">,
  userId: string | null | undefined
): boolean {
  if (!userId || !notification.sent_by) return false;

  return (
    (notification.type === "announcement" || notification.type === "global_announcement") &&
    notification.sent_by === userId
  );
}

export function filterVisibleNotifications(
  notifications: NotificationRecord[],
  userId: string | null | undefined
): NotificationRecord[] {
  return notifications.filter((notification) => !isSelfAuthoredAnnouncement(notification, userId));
}
