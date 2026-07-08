export interface UserProfile {
  id: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  role: string;
  timeZoneId: string;
}
