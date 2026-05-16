const POST_RECORD_VIEW_PATH_PATTERN =
  /^\/(?:staff|guard)\/post-record\/view\/([^/?#]+)\/?$/i;

export function extractSharedPostRecordId(input: string): string | null {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  try {
    const url = new URL(trimmedInput, "http://localhost");
    const pathnameMatch = url.pathname.match(POST_RECORD_VIEW_PATH_PATTERN);
    const postId = pathnameMatch?.[1]?.trim();

    return postId ? decodeURIComponent(postId) : null;
  } catch {
    return null;
  }
}
