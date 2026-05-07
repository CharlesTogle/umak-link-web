"use client";

import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/services/auth-service";

export const userKeys = {
  search: (query: string) => ["users", "search", query] as const,
};

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: userKeys.search(query),
    queryFn: () => searchUsers(query),
    enabled: query.trim().length >= 2,
  });
}
