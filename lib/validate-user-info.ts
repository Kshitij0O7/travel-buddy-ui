import type { UserInfo } from "../interfaces/user-info";

export function validateUserInfo(u: UserInfo): string {
  if (!u.userType) return "Please select who is travelling.";
  if (!u.tripPace) return "Please select a trip pace.";
  if (!u.tripStyle?.length) return "Select at least one trip style.";
  if (!u.diet?.length) return "Select at least one diet preference.";
  return "";
}
