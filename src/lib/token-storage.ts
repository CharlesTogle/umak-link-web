const TOKEN_KEY = "umak_link_web_api_token";
const ROLE_KEY = "umak_link_web_role";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function clearLocalStorageToken(key: string): void {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore clears when browser storage is unavailable.
  }
}

function clearTokenCookie(key: string): void {
  const isSecure = window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`;
}

export function getStoredToken(): string | null {
  if (!canUseBrowserStorage()) return null;

  try {
    const token =
      window.localStorage.getItem(TOKEN_KEY) ??
      window.localStorage.getItem("api_token");

    if (!token) return null;

    const normalizedToken = token.trim();
    return normalizedToken.length > 0 ? normalizedToken : null;
  } catch {
    return null;
  }
}

export function clearStoredToken(): void {
  if (!canUseBrowserStorage()) return;

  clearLocalStorageToken(TOKEN_KEY);
  clearTokenCookie(TOKEN_KEY);
  clearTokenCookie("api_token");
  clearLocalStorageToken("api_token");
  clearLocalStorageToken(ROLE_KEY);
}
