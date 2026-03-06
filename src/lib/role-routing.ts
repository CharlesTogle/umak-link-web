import type { PortalUserType } from "@/types/auth";

export function getRoleHomePath(userType: PortalUserType): "/admin" | "/staff" | "/not-allowed" {
  if (userType === "Admin") return "/admin";
  if (userType === "Staff") return "/staff";
  return "/not-allowed";
}

export function getRoleHomePathFromUserType(
  userType: string | null | undefined
): "/admin" | "/staff" | "/not-allowed" | null {
  if (userType === "Admin") return "/admin";
  if (userType === "Staff") return "/staff";
  if (userType === "User") return "/not-allowed";
  return null;
}
