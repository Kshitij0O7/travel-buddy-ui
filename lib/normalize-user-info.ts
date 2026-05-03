import {
  DIET_OPTIONS,
  TRIP_PACE_OPTIONS,
  TRIP_STYLE_OPTIONS,
  USER_TYPE_OPTIONS,
} from "../constants/user-preferences";
import type { TripPace, UserInfo, UserType } from "../interfaces/user-info";

const USER_TYPES = new Set(USER_TYPE_OPTIONS.map((o) => o.value));
const PACES = new Set(TRIP_PACE_OPTIONS.map((o) => o.value));
const STYLES = new Set(TRIP_STYLE_OPTIONS);
const DIETS = new Set(DIET_OPTIONS);

export function normalizeUserInfo(raw: unknown): UserInfo {
  const empty: UserInfo = {
    userType: "",
    tripPace: "",
    tripStyle: [],
    diet: [],
    specialRequests: [],
  };
  if (!raw || typeof raw !== "object") return empty;

  const r = raw as Record<string, unknown>;

  const userType =
    typeof r.userType === "string" && USER_TYPES.has(r.userType as UserType)
      ? (r.userType as UserType)
      : "";
  const tripPace =
    typeof r.tripPace === "string" && PACES.has(r.tripPace as TripPace)
      ? (r.tripPace as TripPace)
      : "";

  const tripStyle = Array.isArray(r.tripStyle)
    ? r.tripStyle.filter((x): x is string => typeof x === "string" && STYLES.has(x as (typeof TRIP_STYLE_OPTIONS)[number]))
    : [];

  const diet = Array.isArray(r.diet)
    ? r.diet.filter((x): x is string => typeof x === "string" && DIETS.has(x as (typeof DIET_OPTIONS)[number]))
    : [];

  const specialRequests = Array.isArray(r.specialRequests)
    ? r.specialRequests
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return { userType, tripPace, tripStyle, diet, specialRequests };
}
