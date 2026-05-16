import type { PortalUserType } from "@/types/auth";

type RoleHomePath = "/admin" | "/staff" | "/guard" | "/not-allowed";
type RoleNotificationsPath =
  | "/admin/notifications"
  | "/staff/notifications"
  | "/guard/notifications"
  | "/not-allowed";

export function getRoleHomePath(userType: PortalUserType): RoleHomePath {
  if (userType === "Admin") return "/admin";
  if (userType === "Staff") return "/staff";
  if (userType === "Guard") return "/guard";
  return "/not-allowed";
}

export function getRoleHomePathFromUserType(
  userType: string | null | undefined
): RoleHomePath | null {
  if (userType === "Admin") return "/admin";
  if (userType === "Staff") return "/staff";
  if (userType === "Guard") return "/guard";
  if (userType === "User") return "/not-allowed";
  return null;
}

export function getRoleNotificationsPath(userType: PortalUserType): RoleNotificationsPath {
  if (userType === "Admin") return "/admin/notifications";
  if (userType === "Staff") return "/staff/notifications";
  if (userType === "Guard") return "/guard/notifications";
  return "/not-allowed";
}

export function getRoleNotificationsPathFromUserType(
  userType: string | null | undefined
): RoleNotificationsPath | null {
  if (userType === "Admin") return "/admin/notifications";
  if (userType === "Staff") return "/staff/notifications";
  if (userType === "Guard") return "/guard/notifications";
  if (userType === "User") return "/not-allowed";
  return null;
}

export function getRoleNotificationPostPathBaseFromUserType(
  userType: string | null | undefined
): string | null {
  if (userType === "Staff") return "/staff/post-record/view";
  if (userType === "Guard") return null;
  if (userType === "Admin") return null;
  if (userType === "User") return null;
  return null;
}
