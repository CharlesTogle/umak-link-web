export const AMBIGUOUS_IDENTIFICATION_REJECTION_REASON =
  "Item can't be uniquely identified." as const;

export const POST_REJECTION_REASONS = [
  "Item is not identified in storage.",
  "Details don't match the item in question.",
  "This is a spam or malicious post.",
  "There is more than 1 instance of this post.",
  "Item has been discarded.",
  AMBIGUOUS_IDENTIFICATION_REJECTION_REASON,
] as const;
