import { api } from "@/lib/api";

export interface NotificationRecord {
  notification_id: string | number;
  user_id: string;
  title: string;
  body: string;
  description?: string | null;
  sent_to?: string | null;
  sent_by?: string | null;
  type: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  image_url?: string | null;
}

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const { data } = await api.get<{ notifications: NotificationRecord[] }>("/notifications");
  return data.notifications;
}

export async function fetchUnreadNotificationsCount(): Promise<{ unread_count: number }> {
  const { data } = await api.get<{ unread_count: number }>("/notifications/count");
  return data;
}

export async function markNotificationAsRead(notificationId: string | number): Promise<{ success: boolean }> {
  const { data } = await api.patch<{ success: boolean }>(`/notifications/${notificationId}/read`);
  return data;
}

export async function deleteNotification(notificationId: string | number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/notifications/${notificationId}`);
  return data;
}

export async function sendNotification(payload: {
  user_id: string;
  title: string;
  body: string;
  description?: string;
  type?: string;
  data?: Record<string, unknown>;
  image_url?: string;
}) {
  const { data } = await api.post<{ success: boolean; notification_id: number }>("/notifications/send", payload);
  return data;
}
