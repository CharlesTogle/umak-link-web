import { api } from "@/lib/api";

export interface Announcement {
  id: number;
  message: string;
  description: string | null;
  created_at: string;
  image_url?: string | null;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
  count: number;
}

export interface CreateAnnouncementRequest {
  message: string;
  description?: string | null;
  image_url?: string | null;
}

export async function fetchAnnouncements(params?: {
  limit?: number;
  offset?: number;
}): Promise<AnnouncementsResponse> {
  const { data } = await api.get<AnnouncementsResponse>("/announcements", { params });
  return data;
}

export async function createAnnouncement(
  announcement: CreateAnnouncementRequest
): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>("/announcements/send", announcement);
  return data;
}
