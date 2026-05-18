const DEFAULT_ANDROID_APP_DOWNLOAD_PATH = "/downloads/umak-link-android-latest.apk";
const SUPABASE_ANDROID_APP_OBJECT_PATH = "/storage/v1/object/public/android-app/UMak-LINK.apk";

export function getAndroidAppDownloadUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_ANDROID_APP_DOWNLOAD_URL?.trim();
  if (configuredUrl && configuredUrl.length > 0) {
    return configuredUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl && supabaseUrl.length > 0) {
    return `${supabaseUrl.replace(/\/$/, "")}${SUPABASE_ANDROID_APP_OBJECT_PATH}`;
  }

  return DEFAULT_ANDROID_APP_DOWNLOAD_PATH;
}

export function isLocalAndroidAppDownload(url: string): boolean {
  return url.startsWith("/");
}
