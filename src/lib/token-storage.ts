const TOKEN_KEY = "umak_link_web_api_token";
const ROLE_KEY = "umak_link_web_role";
const SIXTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 60;

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

export function clearStoredToken(): void {
  if (!canUseBrowserStorage()) return;

  clearLocalStorageToken(TOKEN_KEY);
  clearTokenCookie(TOKEN_KEY);
  clearTokenCookie("api_token");
  clearLocalStorageToken("api_token");
  clearLocalStorageToken(ROLE_KEY);
}
