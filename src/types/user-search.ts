import type { PortalUserType } from "@/types/auth";

export interface UserSearchResult {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url: string | null;
  user_type?: PortalUserType;
}

export interface RawUserSearchResult {
  user_id?: string | null;
  user_name?: string | null;
  email?: string | null;
  profile_picture_url?: string | null;
  user_type?: PortalUserType;
  out_user_id?: string | null;
  out_user_name?: string | null;
  out_email?: string | null;
  out_profile_picture_url?: string | null;
}

export interface RawUserSearchResponse {
  results: RawUserSearchResult[];
}
