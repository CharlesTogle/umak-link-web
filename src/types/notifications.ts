export type NotificationType =
  | "match"
  | "success"
  | "acceptance"
  | "accept"
  | "info"
  | "message"
  | "rejection"
  | "post_accepted"
  | "global_announcement"
  | "progress"
  | "delete"
  | "found"
  | "resolved";

export interface NotificationData {
  notification_id: string | number;
  type: NotificationType | string;
  title?: string | null;
  description?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  data?: any;
  sent_to?: string | null;
  sent_by?: string | null;
  image_url?: string | null;
}
