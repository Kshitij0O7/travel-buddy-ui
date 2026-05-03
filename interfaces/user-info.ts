/** Who is travelling (single choice in UI) */
export type UserType = "solo" | "couple" | "family" | "friends" | "corporate";

/** Daily intensity (single choice) */
export type TripPace = "relaxed" | "balanced" | "active";

export interface UserInfo {
  userType: UserType | "";
  tripPace: TripPace | "";
  /** Multi-select from TRIP_STYLE_OPTIONS */
  tripStyle: string[];
  /** Multi-select from DIET_OPTIONS */
  diet: string[];
  /** One text field per row; empty strings stripped on submit */
  specialRequests: string[];
}
