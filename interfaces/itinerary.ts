// Itinerary schema — mirrors the shape assembled by the backend planning
// pipeline (travel-buddy-api `lib/agent/hydrate.js`). Flights and hotels live
// under `logistics`; day activities carry resolved place values (name / fact /
// advice) rather than free-form synthesis text.

export interface Activity {
  time: string;
  name: string;
  fact?: string;
  advice?: string;
  /** Debug / re-linking only — hydration already baked in the values. */
  placeRef?: { city: string; index: number };
}

export interface Day {
  day: number;
  date: string;
  city: string;
  title: string;
  activities: Activity[];
}

export interface FlightEndpoint {
  airport?: string;
  iata?: string;
  /** "YYYY-MM-DD HH:MM" */
  time?: string;
}

export interface FlightOption {
  flightNumber?: string;
  airline?: string;
  airlineLogo?: string;
  airplane?: string;
  travelClass?: string;
  departure?: FlightEndpoint;
  arrival?: FlightEndpoint;
  /** Total duration in minutes. */
  duration?: number;
  price?: number;
  currency?: string;
  stops?: number;
  /** Set by the backend scorer on the best option in the set. */
  best?: boolean;
}

export interface FlightQuery {
  origin: string;
  destination: string;
  date: string;
  adults?: number;
  role?: "outbound" | "return" | "interCity";
}

export interface FlightBlock {
  query: FlightQuery;
  options: FlightOption[];
  bestIndex: number;
}

export interface HotelOption {
  name?: string;
  totalPrice?: number;
  currency?: string;
  rating?: number;
  ratingLabel?: string;
  location?: string;
  distanceFromCenter?: string;
  breakfastIncluded?: boolean;
  checkin?: string;
  checkout?: string;
  photo?: string;
  best?: boolean;
}

export interface HotelQuery {
  location: string;
  checkin: string;
  checkout: string;
  adults?: number;
  budget?: string;
}

export interface HotelBlock {
  query: HotelQuery;
  options: HotelOption[];
  bestIndex: number;
}

export interface Logistics {
  flights: {
    outbound: FlightBlock | null;
    return: FlightBlock | null;
    interCity: FlightBlock[];
  };
  hotelsByCity: Record<string, HotelBlock>;
  refreshedAt?: string;
}

export interface WeatherDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
}

export interface Weather {
  location: string;
  dataType: "forecast" | "historical";
  summary: WeatherDay[];
}

export interface QueryPlan {
  flights: FlightQuery[];
  hotels: HotelQuery[];
}

export interface Itinerary {
  destination: string;
  origin: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  isMultiCity?: boolean;
  keyCities?: string[];
  currency?: string;
  currencySymbol?: string;
  weather?: Weather | null;
  days: Day[];
  logistics?: Logistics | null;
  /** Persisted so a future "Get Latest Prices" can refresh without replanning. */
  queryPlan?: QueryPlan;
  generatedAt?: string;
  /** UI-only: user's chosen hotel (name) from the hotels tab. */
  selectedHotelName?: string;
}

export type ItineraryTabKey = "itinerary" | "flights" | "hotels";
