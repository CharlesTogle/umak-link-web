import { api } from "@/lib/api";

export async function deleteClaimByItem(itemId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/claims/by-item/${itemId}`);
  return data;
}
