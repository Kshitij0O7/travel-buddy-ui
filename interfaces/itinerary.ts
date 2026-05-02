export interface Activity {
  time: string;
  activity: string;
  details: string;
  tip?: string;
}

export interface Day {
  day: number;
  date: string;
  title: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
  accommodation: string;
  travelNote?: string;
}

export interface Flight {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
}

export interface Hotel {
  name: string;
  rating: number;
  totalPrice: number;
  currency: string;
  location: string;
  distanceFromCenter: string;
}

export interface Itinerary {
  destination: string;
  origin: string;
  duration: string;
  summary: string;
  weather: { summary: string; temperature: string; advice: string };
  flights: { outbound: Flight[]; return: Flight[]; recommendation: string };
  hotels: Hotel[];
  hotelRecommendation: string;
  days: Day[];
  practicalTips: string[];
  estimatedBudget: {
    flights: string;
    hotels: string;
    food: string;
    activities: string;
    total: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  hasUpdate?: boolean;
}

export type ItineraryTabKey = "itinerary" | "flights" | "hotels" | "tips";
