"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CheckCheck,
  Info,
  Mail,
  XCircle,
  Megaphone,
  Hourglass,
  Trash2,
  Shield,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NotificationData, NotificationType } from "@/types/notifications";
import Image from "next/image";

interface NotificationItemProps {
  notification: NotificationData;
  postHrefBase?: string | null;
  notificationsHref?: string | null;
  onMarkAsRead?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}

function toStringValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function resolveNotificationHref(
  notification: NotificationData,
  postHrefBase?: string | null,
  notificationsHref?: string | null
): string | null {
  if (notification.type === "global_announcement" || notification.type === "announcement") {
    return null;
  }

  const explicitHref =
    toStringValue(notification.data?.url) ??
    toStringValue(notification.data?.href) ??
    toStringValue(notification.data?.link);
  const postId =
    toStringValue(notification.data?.postId) ??
    toStringValue(notification.data?.post_id);

  if (explicitHref && !explicitHref.startsWith("/user/")) {
    return explicitHref;
  }

  if (explicitHref?.startsWith("/user/post/view/") && postHrefBase && postId) {
    return `${postHrefBase}/${postId}`;
  }

  if (explicitHref?.startsWith("/user/") && notificationsHref) {
    return notificationsHref;
  }

  if (postHrefBase && postId) {
    return `${postHrefBase}/${postId}`;
  }

  return explicitHref ?? notificationsHref ?? null;
}

function iconForType(type: NotificationType | string) {
  switch (type) {
    case "match":
      return { icon: CheckCircle, colorClass: "text-green-600" };
    case "success":
      return { icon: CheckCheck, colorClass: "text-green-600" };
    case "acceptance":
      return { icon: CheckCircle, colorClass: "text-green-600" };
    case "accept":
      return { icon: CheckCheck, colorClass: "text-green-600" };
    case "info":
      return { icon: Info, colorClass: "text-blue-600" };
    case "message":
      return { icon: Mail, colorClass: "text-[#1D2981]" };
    case "rejection":
      return { icon: XCircle, colorClass: "text-red-600" };
    case "post_accepted":
      return { icon: CheckCheck, colorClass: "text-green-600" };
    case "announcement":
    case "global_announcement":
      return { icon: Megaphone, colorClass: "text-red-600" };
    case "progress":
      return { icon: Hourglass, colorClass: "text-amber-600" };
    case "delete":
      return { icon: Trash2, colorClass: "text-red-600" };
    default:
      return { icon: Shield, colorClass: "text-slate-700" };
  }
}

export function NotificationItem({
  notification,
  postHrefBase = null,
  notificationsHref = null,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const router = useRouter();

  const { icon: IconComponent, colorClass } = iconForType(notification.type);
  const isRead = notification.is_read ?? false;

  const handleClick = () => {
    const href = resolveNotificationHref(notification, postHrefBase, notificationsHref);

    if (href) {
      if (!isRead && onMarkAsRead) {
        onMarkAsRead(notification.notification_id);
      }
      router.push(href);
      return;
    }

    // Default: toggle expand
    setExpanded(!expanded);
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(notification.notification_id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.notification_id);
    }
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.notification_id);
    }
    setShowActions(false);
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const title = notification.title || "Notification";
  const description = notification.description || "";

  return (
    <div
      onClick={handleClick}
      className={`relative flex items-start gap-3 border-b border-slate-200 px-4 py-3 transition-all hover:bg-slate-50 ${
        isRead ? (expanded ? "bg-slate-50 opacity-100" : "bg-slate-50 opacity-70") : "cursor-pointer"
      }`}
    >
      {/* Icon */}
      <div className={`mt-0.5 ${colorClass}`}>
        <IconComponent className="size-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={`text-[15px] text-slate-900 ${isRead ? "font-normal" : "font-semibold"} ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {title}
        </div>
        <div className={`text-[13px] text-slate-600 ${expanded ? "" : "line-clamp-2"}`}>{description}</div>

        {/* Expanded image */}
        {expanded && notification.image_url && (
          <div className="mt-3">
            <Image
              src={notification.image_url}
              alt="notification"
              width={600}
              height={240}
              className="h-60 w-full rounded object-cover"
              unoptimized
            />
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleActions}
          aria-label="Actions"
          className="text-slate-700 hover:bg-slate-100"
        >
          <MoreVertical className="size-4" />
        </Button>

        {showActions && (
          <>
            {/* Backdrop to close menu */}
            <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />

            {/* Dropdown menu */}
            <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
              {!isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <CheckCircle className="size-4" />
                  Mark as read
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
                Delete notification
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
