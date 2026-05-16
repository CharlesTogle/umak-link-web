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

export interface FetchAnnouncementsParams {
  limit?: number;
  offset?: number;
}

export async function fetchAnnouncements(params?: FetchAnnouncementsParams): Promise<AnnouncementsResponse> {
  const { data } = await api.get<AnnouncementsResponse>("/announcements", { params });
  return data;
}

export async function fetchAllAnnouncements(pageSize = 100): Promise<Announcement[]> {
  const announcements: Announcement[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchAnnouncements({ limit: pageSize, offset });
    announcements.push(...page.announcements);

    if (page.announcements.length < pageSize) {
      break;
    }

    offset += page.announcements.length;
  }

  return announcements;
}

export async function createAnnouncement(
  announcement: CreateAnnouncementRequest
): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>("/announcements/send", announcement);
  return data;
}
