import { AMBIGUOUS_IDENTIFICATION_REJECTION_REASON } from "@/config/constants";

function normalizeReason(reason?: string | null): string | null {
  if (typeof reason !== "string") return null;
  const trimmedReason = reason.trim();
  return trimmedReason.length > 0 ? trimmedReason : null;
}

export function buildPostRejectionNotificationCopy(params: {
  itemName: string;
  rejectionReason?: string | null;
}) {
  const rejectionReason =
    normalizeReason(params.rejectionReason) ?? "No reason provided.";

  if (rejectionReason === AMBIGUOUS_IDENTIFICATION_REJECTION_REASON) {
    return {
      body: `Your post about "${params.itemName}" has been rejected because the item can't be uniquely identified. We'll notify you if we find any similar posts in the same location.`,
      description:
        "We'll notify you if we find any similar posts in the same location.",
    };
  }

  return {
    body: `Your post about "${params.itemName}" has been rejected and will not be published on the platform. You can edit and submit again or delete it. Reason: ${rejectionReason}`,
    description: rejectionReason,
  };
}
