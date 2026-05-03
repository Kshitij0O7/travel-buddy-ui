import type { TripPace, UserType } from "../interfaces/user-info";

export const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "corporate", label: "Corporate" },
];

export const TRIP_PACE_OPTIONS: { value: TripPace; label: string }[] = [
  { value: "relaxed", label: "Relaxed" },
  { value: "balanced", label: "Balanced" },
  { value: "active", label: "Active" },
];

export const TRIP_STYLE_OPTIONS = [
  "cultural",
  "adventure",
  "historical",
  "foodie",
  "party",
  "religious",
] as const;

export const DIET_OPTIONS = ["veg", "vegan", "non-veg", "jain"] as const;
