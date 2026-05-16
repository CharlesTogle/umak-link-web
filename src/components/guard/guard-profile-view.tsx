import { ProfileView } from "@/components/profile/profile-view";

export function GuardProfileView() {
  return <ProfileView fallbackName="Guard User" fallbackRole="Guard" />;
}
