export type PortalUserType = "User" | "Staff" | "Admin";

export interface AuthUser {
  user_id: string;
  user_name: string | null;
  email: string | null;
  profile_picture_url: string | null;
  user_type: PortalUserType;
  notification_token: string | null;
}

export interface AuthMeResponse {
  user: AuthUser;
}

export interface UserListItem {
  user_id: string;
  user_name: string | null;
  email: string | null;
  profile_picture_url: string | null;
  user_type: PortalUserType;
  created_at: string | null;
  last_login: string | null;
}

export interface UserListResponse {
  users: UserListItem[];
}
