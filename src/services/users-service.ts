import { api } from "@/lib/api";
import type {
  RawUserSearchResponse,
  RawUserSearchResult,
  UserSearchResult,
} from "@/types/user-search";

function normalizeUserSearchResult(result: RawUserSearchResult): UserSearchResult {
  return {
    user_id: String(result.user_id ?? result.out_user_id ?? ""),
    user_name: String(result.user_name ?? result.out_user_name ?? ""),
    email: String(result.email ?? result.out_email ?? ""),
    profile_picture_url:
      result.profile_picture_url ?? result.out_profile_picture_url ?? null,
    ...(result.user_type ? { user_type: result.user_type } : {}),
  };
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const { data } = await api.get<RawUserSearchResponse>("/users/search", {
    params: { query },
  });

  return data.results.map(normalizeUserSearchResult);
}
