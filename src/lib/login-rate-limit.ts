const LOGIN_ATTEMPT_STORAGE_KEY = "umak_link_web_last_login_attempt_at";

export const LOGIN_COOLDOWN_MS = 3000;

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function readLastLoginAttemptAt(): number | null {
  if (!canUseBrowserStorage()) return null;

  try {
    const rawValue = window.localStorage.getItem(LOGIN_ATTEMPT_STORAGE_KEY);
    if (!rawValue) return null;

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function getRemainingLoginCooldownMs(now = Date.now()): number {
  const lastAttemptAt = readLastLoginAttemptAt();
  if (!lastAttemptAt) return 0;

  return Math.max(0, LOGIN_COOLDOWN_MS - (now - lastAttemptAt));
}

export function registerLoginAttempt(now = Date.now()): void {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(LOGIN_ATTEMPT_STORAGE_KEY, String(now));
  } catch {
    // Ignore storage failures so login itself is not blocked.
  }
}
