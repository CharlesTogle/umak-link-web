import type { PortalUserType } from "@/types/auth";

export const PORTAL_LOGIN_REJECTION_MESSAGE = "Unauthorized account.";

export function isPortalLoginAllowedUserType(
  userType: string | null | undefined
): userType is Extract<PortalUserType, "Admin" | "Staff"> {
  return userType === "Admin" || userType === "Staff";
}
