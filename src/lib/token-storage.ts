const TOKEN_KEY = "umak_link_web_api_token";
const LEGACY_TOKEN_KEY = "api_token";
const ROLE_KEY = "umak_link_web_role";
const SIXTY_DAYS_IN_SECONDS = 60 * 24 * 60 * 60;

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const pairs = document.cookie
    ? document.cookie.split(";").map((value) => value.trim()).filter(Boolean)
    : [];
  for (const pair of pairs) {
    const [rawKey, ...rawValue] = pair.split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payloadPart = parts[1];
  if (!payloadPart) return null;

  try {
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = JSON.parse(window.atob(padded)) as unknown;

    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function isPortalRoleToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  return payload?.user_type === "Admin" || payload?.user_type === "Staff";
}

function getPortalRoleFromToken(token: string): "Admin" | "Staff" | null {
  const payload = decodeJwtPayload(token);
  if (payload?.user_type === "Admin") return "Admin";
  if (payload?.user_type === "Staff") return "Staff";
  return null;
}

function isPortalRole(role: string | null): role is "Admin" | "Staff" {
  return role === "Admin" || role === "Staff";
}

function getLocalStorageToken(key: string): string | null {
  if (!canUseBrowserStorage()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageToken(key: string, token: string): void {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(key, token);
  } catch {
    // Ignore writes when browser storage is unavailable.
  }
}

function clearLocalStorageToken(key: string): void {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore clears when browser storage is unavailable.
  }
}

function setTokenCookie(key: string, token: string): void {
  const isSecure = window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${key}=${encodeURIComponent(token)}; Path=/; Max-Age=${SIXTY_DAYS_IN_SECONDS}; SameSite=Lax${secureAttr}`;
}

function clearTokenCookie(key: string): void {
  const isSecure = window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`;
}

export function getStoredToken(): string | null {
  if (!canUseBrowserStorage()) return null;

  const cookieToken = getCookieValue(TOKEN_KEY);
  const localToken = getLocalStorageToken(TOKEN_KEY);

  if (localToken && isPortalRoleToken(localToken)) {
    if (cookieToken !== localToken) {
      setTokenCookie(TOKEN_KEY, localToken);
    }
    return localToken;
  }

  if (cookieToken && isPortalRoleToken(cookieToken)) {
    if (localToken !== cookieToken) {
      setLocalStorageToken(TOKEN_KEY, cookieToken);
    }
    return cookieToken;
  }

  if (localToken && !isPortalRoleToken(localToken)) {
    clearLocalStorageToken(TOKEN_KEY);
  }
  if (cookieToken && !isPortalRoleToken(cookieToken)) {
    clearTokenCookie(TOKEN_KEY);
  }

  const legacyLocalToken = getLocalStorageToken(LEGACY_TOKEN_KEY);
  if (legacyLocalToken && isPortalRoleToken(legacyLocalToken)) {
    setLocalStorageToken(TOKEN_KEY, legacyLocalToken);
    setTokenCookie(TOKEN_KEY, legacyLocalToken);
    return legacyLocalToken;
  }

  const legacyCookieToken = getCookieValue(LEGACY_TOKEN_KEY);
  if (legacyCookieToken && isPortalRoleToken(legacyCookieToken)) {
    setLocalStorageToken(TOKEN_KEY, legacyCookieToken);
    setTokenCookie(TOKEN_KEY, legacyCookieToken);
    return legacyCookieToken;
  }

  return null;
}

export function getStoredTokenRole(): "Admin" | "Staff" | null {
  if (!canUseBrowserStorage()) return null;

  const storedRole = getLocalStorageToken(ROLE_KEY);
  if (isPortalRole(storedRole)) {
    return storedRole;
  }

  const token = getStoredToken();
  if (!token) return null;
  const tokenRole = getPortalRoleFromToken(token);
  if (!tokenRole) return null;

  setLocalStorageToken(ROLE_KEY, tokenRole);
  return tokenRole;
}

export function setStoredToken(token: string, role?: "Admin" | "Staff"): void {
  if (!canUseBrowserStorage()) return;

  setLocalStorageToken(TOKEN_KEY, token);
  setTokenCookie(TOKEN_KEY, token);
  if (role) {
    setLocalStorageToken(ROLE_KEY, role);
  } else {
    const tokenRole = getPortalRoleFromToken(token);
    if (tokenRole) {
      setLocalStorageToken(ROLE_KEY, tokenRole);
    }
  }
}

export function clearStoredToken(): void {
  if (!canUseBrowserStorage()) return;

  clearLocalStorageToken(TOKEN_KEY);
  clearTokenCookie(TOKEN_KEY);
  clearLocalStorageToken(ROLE_KEY);
}
