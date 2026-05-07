export type ShareLinkResult = "shared" | "copied" | "cancelled";

interface ShareLinkOptions {
  title: string;
  url: string;
  text?: string;
}

export async function shareLink(options: ShareLinkOptions): Promise<ShareLinkResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: options.title,
        url: options.url,
        ...(options.text ? { text: options.text } : {}),
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(options.url);
    return "copied";
  }

  throw new Error("Share is not supported in this browser");
}
